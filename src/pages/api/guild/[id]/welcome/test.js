// pages/api/guild/[id]/welcome/test.js
import { adminDb } from "@/lib/firebaseAdmin";
import {
  withWelcomeDefaults,
  buildVariableContext,
  replaceVariables,
  isValidWebhookUrl,
  toDiscordEmbed,
  embedIsEmpty,
} from "@/lib/welcome";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_LOG_ENTRIES = 30;

export default async function handler(req, res) {
  try {
    const { id: guildId } = req.query;

    if (!guildId) {
      return res.status(400).json({ error: "guildId é obrigatório" });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Método não permitido" });
    }

    const ip = getClientIp(req);
    // Webhook tests are limited harder than normal saves to avoid spamming
    // the destination channel.
    const { allowed, retryAfter } = rateLimit(`${guildId}:${ip}:test`, 5, 60_000);
    if (!allowed) {
      res.setHeader("Retry-After", retryAfter);
      return res
        .status(429)
        .json({ error: "Muitos testes seguidos, aguarde um pouco antes de tentar novamente" });
    }

    const snapshot = await adminDb.ref(`welcome_configs/${guildId}`).once("value");
    const config = withWelcomeDefaults(snapshot.val());

    // Allow overriding the webhook URL / message for a one-off test without
    // saving it first (useful while editing).
    const webhookUrl = req.body?.webhookUrl || config.webhookUrl;
    const message = req.body?.message || config.message;
    const flags = req.body?.flags ?? config.flags;

    if (!isValidWebhookUrl(webhookUrl)) {
      return res.status(400).json({ error: "URL de webhook inválida ou não configurada" });
    }

    const context = buildVariableContext({
      user: {
        id: "123456789012345678",
        username: "membro-teste",
        joinedAt: Date.now(),
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
      },
      guild: { name: "Servidor de Teste", memberCount: 1234 },
    });

    const payload = buildDiscordPayload(message, flags, context);

    const startedAt = Date.now();
    let discordStatus;
    let discordError = null;

    try {
      const response = await fetch(`${webhookUrl}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      discordStatus = response.status;

      if (!response.ok) {
        const errorBody = await safeJson(response);
        discordError = errorBody?.message || `Discord retornou status ${response.status}`;
      }
    } catch (fetchErr) {
      discordStatus = 0;
      discordError = "Não foi possível conectar ao webhook do Discord";
    }

    const durationMs = Date.now() - startedAt;
    const success = !discordError;

    await appendLog(guildId, {
      type: "test",
      success,
      status: discordStatus,
      error: discordError,
      durationMs,
      ip,
      timestamp: Date.now(),
    });

    if (!success) {
      return res.status(502).json({ error: discordError, status: discordStatus });
    }

    return res.status(200).json({ success: true, status: discordStatus, durationMs });
  } catch (err) {
    console.error("[welcome/test] erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Builds the Discord webhook payload for either message mode.
function buildDiscordPayload(message, flags, context) {
  const content = replaceVariables(message?.content || "", context);
  const isV2 = flags === 32768;

  const payload = { flags: flags || 0 };

  if (!isV2) {
    // Traditional mode: content + embeds
    if (content) payload.content = content;

    if (Array.isArray(message?.embeds) && message.embeds.length > 0) {
      const embeds = message.embeds
        .filter((embed) => !embedIsEmpty(embed))
        .map((embed) => toDiscordEmbed(substituteEmbedVariables(embed, context)));
      if (embeds.length > 0) payload.embeds = embeds;
    }
  } else {
    // V2 mode: components array, sanitize accent_color for Container
    if (Array.isArray(message?.components) && message.components.length > 0) {
      payload.components = message.components.map(sanitizeV2Component);
    }
  }

  // Discord rejects fully empty payloads.
  if (!payload.content && !payload.embeds && !payload.components) {
    payload.content = "✅ Teste do sistema de boas-vindas.";
    delete payload.flags; // remove V2 flag if we fell back to plain text
  }

  return payload;
}

// Removes editor-only fields (like accent_color_hex) before sending to Discord.
function sanitizeV2Component(comp) {
  if (!comp || typeof comp !== "object") return comp;

  const cleaned = { ...comp };

  // Container: convert hex back to int and drop the _hex field
  if (comp.type === 17) {
    if (typeof comp.accent_color_hex === "string") {
      const hex = comp.accent_color_hex.trim().replace(/^#/, "");
      const int = parseInt(hex, 16);
      if (!isNaN(int)) cleaned.accent_color = int;
    }
    delete cleaned.accent_color_hex;
    if (Array.isArray(comp.components)) {
      cleaned.components = comp.components.map(sanitizeV2Component);
    }
  }

  // Section: sanitize nested components
  if (comp.type === 9 && Array.isArray(comp.components)) {
    cleaned.components = comp.components.map(sanitizeV2Component);
  }

  return cleaned;
}

// Applies {variable} substitution to every text field of an embed.
function substituteEmbedVariables(embed, context) {
  return {
    ...embed,
    title: replaceVariables(embed.title || "", context),
    description: replaceVariables(embed.description || "", context),
    footer: {
      ...embed.footer,
      text: replaceVariables(embed.footer?.text || "", context),
    },
    author: {
      ...embed.author,
      name: replaceVariables(embed.author?.name || "", context),
    },
    fields: Array.isArray(embed.fields)
      ? embed.fields.map((f) => ({
          ...f,
          name: replaceVariables(f.name || "", context),
          value: replaceVariables(f.value || "", context),
        }))
      : [],
  };
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function appendLog(guildId, entry) {
  const logsRef = adminDb.ref(`welcome_logs/${guildId}`);
  await logsRef.push(entry);

  const snapshot = await logsRef.once("value");
  const entries = snapshot.val();
  if (!entries) return;

  const keys = Object.keys(entries).sort();
  if (keys.length <= MAX_LOG_ENTRIES) return;

  const toRemove = keys.slice(0, keys.length - MAX_LOG_ENTRIES);
  const updates = {};
  for (const key of toRemove) updates[key] = null;
  await logsRef.update(updates);
}