// pages/api/guild/[id]/welcome/index.js
import { adminDb } from "@/lib/firebaseAdmin";
import {
  withWelcomeDefaults,
  validateWelcomeConfig,
  sanitizeWelcomeConfig,
} from "@/lib/welcome";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_HISTORY_ENTRIES = 20;

export default async function handler(req, res) {
  try {
    const { id: guildId } = req.query;

    if (!guildId) {
      return res.status(400).json({ error: "guildId é obrigatório" });
    }

    if (req.method === "GET") {
      return handleGet(req, res, guildId);
    }

    if (req.method === "POST") {
      return handlePost(req, res, guildId);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[welcome] erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function handleGet(req, res, guildId) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`${guildId}:${ip}:get`, 60, 60_000);
  if (!allowed) {
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({ error: "Muitas requisições, tente novamente em breve" });
  }

  const snapshot = await adminDb.ref(`welcome_configs/${guildId}`).once("value");
  const config = withWelcomeDefaults(snapshot.val());

  return res.status(200).json(config);
}

async function handlePost(req, res, guildId) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`${guildId}:${ip}:save`, 20, 60_000);
  if (!allowed) {
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({ error: "Muitas requisições, tente novamente em breve" });
  }

  const { valid, errors } = validateWelcomeConfig(req.body);
  if (!valid) {
    return res.status(400).json({ error: "Configuração inválida", details: errors });
  }

  const sanitized = sanitizeWelcomeConfig(req.body);
  const now = Date.now();

  const ref = adminDb.ref(`welcome_configs/${guildId}`);

  // Grab the previous version for the audit trail before overwriting.
  const previousSnapshot = await ref.once("value");
  const previous = previousSnapshot.val();

  const payload = {
    ...sanitized,
    guildId,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  await ref.set(payload);

  // Best-effort audit log — never blocks the main save if it fails.
  try {
    await appendHistory(guildId, previous, payload, ip);
  } catch (historyErr) {
    console.error(`[welcome] falha ao registrar histórico (${guildId}):`, historyErr);
  }

  return res.status(200).json({ success: true, config: payload });
}

async function appendHistory(guildId, previous, next, ip) {
  const historyRef = adminDb.ref(`welcome_history/${guildId}`);

  await historyRef.push({
    timestamp: Date.now(),
    ip,
    previous: previous || null,
    next,
  });

  // Trim history to the most recent MAX_HISTORY_ENTRIES entries.
  const snapshot = await historyRef.once("value");
  const entries = snapshot.val();
  if (!entries) return;

  const keys = Object.keys(entries).sort();
  if (keys.length <= MAX_HISTORY_ENTRIES) return;

  const toRemove = keys.slice(0, keys.length - MAX_HISTORY_ENTRIES);
  const updates = {};
  for (const key of toRemove) updates[key] = null;
  await historyRef.update(updates);
}