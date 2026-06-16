// lib/welcome.js
// Shared utilities for the Welcome System (settings, content variables,
// validation helpers). Used by both the dashboard UI and the API routes.

// ---------------------------------------------------------------------------
// Dynamic variables available in the welcome message content
// ---------------------------------------------------------------------------
export const WELCOME_VARIABLES = [
  {
    key: "{user}",
    label: "Menção",
    description: "Menciona o novo membro (ping)",
    example: "<@123456789012345678>",
  },
  {
    key: "{username}",
    label: "Nome de usuário",
    description: "Nome de usuário do Discord",
    example: "joaozinho",
  },
  {
    key: "{user.tag}",
    label: "Usuário com ID",
    description: "Nome de usuário seguido do ID",
    example: "joaozinho (123456789012345678)",
  },
  {
    key: "{user.id}",
    label: "ID do usuário",
    description: "ID numérico do membro",
    example: "123456789012345678",
  },
  {
    key: "{guild}",
    label: "Servidor",
    description: "Nome do servidor (alias de guild.name)",
    example: "Minha Comunidade",
  },
  {
    key: "{guild.name}",
    label: "Nome do servidor",
    description: "Nome do servidor",
    example: "Minha Comunidade",
  },
  {
    key: "{guild.memberCount}",
    label: "Total de membros",
    description: "Quantidade atual de membros do servidor",
    example: "1.284",
  },
  {
    key: "{joinDate}",
    label: "Data de entrada",
    description: "Data e hora em que o membro entrou",
    example: "14/06/2026 às 19:42",
  },
  {
    key: "{createdAt}",
    label: "Conta criada em",
    description: "Data de criação da conta do membro",
    example: "02/01/2021 às 10:15",
  },
];

// ---------------------------------------------------------------------------
// Limits / flags
// ---------------------------------------------------------------------------
export const MESSAGE_FLAGS = {
  DEFAULT: 0,
  COMPONENTS_V2: 32768,
};

export const MAX_CONTENT_LENGTH = 2000;
export const MAX_EMBEDS = 10;
export const MAX_FIELDS_PER_EMBED = 25;

// Discord embed field character limits
export const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
};

export const DEFAULT_EMBED_COLOR = "#5865F2";

// ---------------------------------------------------------------------------
// Default config shape (mirrors the `welcome_configs` table)
// ---------------------------------------------------------------------------
export function createDefaultWelcomeConfig() {
  return {
    enabled: false,
    webhookUrl: "",
    flags: MESSAGE_FLAGS.DEFAULT,
    message: {
      content: "Bem-vindo(a) {user} ao **{guild.name}**! 🎉\nAgora somos **{guild.memberCount}** membros.",
      embeds: [],
      components: [],
    },
    updatedAt: null,
  };
}

// Deep-merge a stored config with the defaults so missing fields never break
// the UI (useful when the record in Firebase predates new fields).
export function withWelcomeDefaults(stored) {
  const defaults = createDefaultWelcomeConfig();
  if (!stored || typeof stored !== "object") return defaults;

  return {
    ...defaults,
    ...stored,
    message: {
      ...defaults.message,
      ...(stored.message || {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Embed helpers
// ---------------------------------------------------------------------------

export function createEmptyEmbed() {
  return {
    title: "",
    description: "",
    url: "",
    color: DEFAULT_EMBED_COLOR,
    image: { url: "" },
    thumbnail: { url: "" },
    footer: { text: "", iconURL: "" },
    author: { name: "", url: "", iconURL: "" },
    fields: [],
  };
}

export function createEmptyEmbedField() {
  return { name: "", value: "", inline: false };
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(color) {
  return typeof color === "string" && HEX_COLOR_REGEX.test(color.trim());
}

export function hexToInt(color) {
  if (!isValidHexColor(color)) return 0;
  return parseInt(color.trim().slice(1), 16);
}

export function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// True if the embed has the minimum content required to be sent on its own
// (title or description).
export function embedHasContent(embed) {
  if (!embed || typeof embed !== "object") return false;
  return !!(embed.title?.trim() || embed.description?.trim());
}

// True if the embed has nothing set at all (used to drop fully-empty embeds
// before sending to Discord, while still allowing the editor to keep an
// "in progress" empty embed around).
export function embedIsEmpty(embed) {
  if (!embed || typeof embed !== "object") return true;
  return !(
    embed.title?.trim() ||
    embed.description?.trim() ||
    embed.url?.trim() ||
    embed.image?.url?.trim() ||
    embed.thumbnail?.url?.trim() ||
    embed.footer?.text?.trim() ||
    embed.author?.name?.trim() ||
    (Array.isArray(embed.fields) && embed.fields.some((f) => f?.name?.trim() && f?.value?.trim()))
  );
}

// Converts an internal embed (hex color, camelCase keys) into the shape the
// Discord webhook API expects (integer color, snake_case icon_url, only
// non-empty sub-objects).
export function toDiscordEmbed(embed) {
  const result = {};

  if (embed.title?.trim()) result.title = embed.title;
  if (embed.description?.trim()) result.description = embed.description;
  if (embed.url?.trim() && isValidUrl(embed.url)) result.url = embed.url;
  if (isValidHexColor(embed.color)) result.color = hexToInt(embed.color);

  if (embed.image?.url?.trim() && isValidUrl(embed.image.url)) {
    result.image = { url: embed.image.url };
  }
  if (embed.thumbnail?.url?.trim() && isValidUrl(embed.thumbnail.url)) {
    result.thumbnail = { url: embed.thumbnail.url };
  }

  if (embed.footer?.text?.trim()) {
    result.footer = { text: embed.footer.text };
    if (embed.footer.iconURL?.trim() && isValidUrl(embed.footer.iconURL)) {
      result.footer.icon_url = embed.footer.iconURL;
    }
  }

  if (embed.author?.name?.trim()) {
    result.author = { name: embed.author.name };
    if (embed.author.url?.trim() && isValidUrl(embed.author.url)) {
      result.author.url = embed.author.url;
    }
    if (embed.author.iconURL?.trim() && isValidUrl(embed.author.iconURL)) {
      result.author.icon_url = embed.author.iconURL;
    }
  }

  if (Array.isArray(embed.fields) && embed.fields.length > 0) {
    const fields = embed.fields
      .filter((f) => f?.name?.trim() && f?.value?.trim())
      .map((f) => ({ name: f.name, value: f.value, inline: !!f.inline }));
    if (fields.length > 0) result.fields = fields;
  }

  return result;
}


// Builds the substitution context for a preview (fake data) or for a real
// "member joined" event (real user/guild data).
export function buildVariableContext({ user, guild } = {}) {
  const now = new Date();

  return {
    "{user}": user?.id ? `<@${user.id}>` : "@novomembro",
    "{username}": user?.username || "novomembro",
    "{user.tag}": user?.id
      ? `${user.username || "novomembro"} (${user.id})`
      : "novomembro (000000000000000000)",
    "{user.id}": user?.id || "000000000000000000",
    "{guild}": guild?.name || "Servidor",
    "{guild.name}": guild?.name || "Servidor",
    "{guild.memberCount}": formatNumber(
      guild?.memberCount ?? guild?.approximate_member_count ?? 0
    ),
    "{joinDate}": user?.joinedAt
      ? formatDateTime(new Date(user.joinedAt))
      : formatDateTime(now),
    "{createdAt}": user?.createdAt
      ? formatDateTime(new Date(user.createdAt))
      : formatDateTime(now),
  };
}

export function replaceVariables(text, context) {
  if (!text) return "";
  let result = text;
  for (const [key, value] of Object.entries(context)) {
    // Escape regex special chars in the key (braces/dots)
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), value);
  }
  return result;
}

function formatNumber(n) {
  return new Intl.NumberFormat("pt-BR").format(Number(n) || 0);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const DISCORD_WEBHOOK_REGEX =
  /^https:\/\/(?:canary\.|ptb\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d{17,20}\/[\w-]{60,}$/;

export function isValidWebhookUrl(url) {
  if (!url) return false;
  return DISCORD_WEBHOOK_REGEX.test(url.trim());
}

// Validates a full welcome config payload before persisting it.
// Returns { valid: boolean, errors: string[] }
export function validateWelcomeConfig(body) {
  const errors = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Corpo da requisição inválido"] };
  }

  if (typeof body.enabled !== "boolean") {
    errors.push("'enabled' deve ser um booleano");
  }

  if (body.webhookUrl !== "" && body.webhookUrl !== undefined) {
    if (typeof body.webhookUrl !== "string" || !isValidWebhookUrl(body.webhookUrl)) {
      errors.push("'webhookUrl' não é uma URL de webhook do Discord válida");
    }
  }

  if (
    body.flags !== undefined &&
    body.flags !== MESSAGE_FLAGS.DEFAULT &&
    body.flags !== MESSAGE_FLAGS.COMPONENTS_V2
  ) {
    errors.push("'flags' deve ser 0 ou 32768");
  }

  const message = body.message || {};

  if (message.content !== undefined) {
    if (typeof message.content !== "string") {
      errors.push("'message.content' deve ser uma string");
    } else if (message.content.length > MAX_CONTENT_LENGTH) {
      errors.push(`'message.content' excede o limite de ${MAX_CONTENT_LENGTH} caracteres`);
    }
  }

  if (message.embeds !== undefined) {
    if (!Array.isArray(message.embeds)) {
      errors.push("'message.embeds' deve ser uma lista");
    } else if (message.embeds.length > MAX_EMBEDS) {
      errors.push(`'message.embeds' excede o limite de ${MAX_EMBEDS} embeds`);
    } else {
      message.embeds.forEach((embed, index) => {
        errors.push(...validateEmbed(embed, index));
      });
    }
  }

  if (message.components !== undefined && !Array.isArray(message.components)) {
    errors.push("'message.components' deve ser uma lista");
  }

  // A message can't be completely empty (no content, no embed with
  // title/description, and no components)
  const hasContent = !!message.content?.trim();
  const hasMeaningfulEmbed =
    Array.isArray(message.embeds) && message.embeds.some(embedHasContent);
  const hasComponents = Array.isArray(message.components) && message.components.length > 0;
  if (body.enabled && !hasContent && !hasMeaningfulEmbed && !hasComponents) {
    errors.push(
      "A mensagem deve conter um texto (content) ou ao menos um embed com título ou descrição"
    );
  }

  return { valid: errors.length === 0, errors };
}

// Validates a single embed object. Returns an array of error strings
// (empty if the embed is valid). All checks are optional/lenient — an
// embed with no fields set at all is valid (it just won't be "meaningful").
export function validateEmbed(embed, index) {
  const errors = [];
  const prefix = `Embed #${index + 1}:`;

  if (typeof embed !== "object" || embed === null) {
    return [`${prefix} deve ser um objeto`];
  }

  if (embed.title !== undefined && embed.title !== "") {
    if (typeof embed.title !== "string") {
      errors.push(`${prefix} 'title' deve ser uma string`);
    } else if (embed.title.length > EMBED_LIMITS.title) {
      errors.push(`${prefix} 'title' excede ${EMBED_LIMITS.title} caracteres`);
    }
  }

  if (embed.description !== undefined && embed.description !== "") {
    if (typeof embed.description !== "string") {
      errors.push(`${prefix} 'description' deve ser uma string`);
    } else if (embed.description.length > EMBED_LIMITS.description) {
      errors.push(`${prefix} 'description' excede ${EMBED_LIMITS.description} caracteres`);
    }
  }

  if (embed.url && !isValidUrl(embed.url)) {
    errors.push(`${prefix} 'url' inválida`);
  }

  if (embed.color !== undefined && embed.color !== "" && !isValidHexColor(embed.color)) {
    errors.push(`${prefix} 'color' deve ser um hexadecimal no formato #RRGGBB`);
  }

  if (embed.image?.url && !isValidUrl(embed.image.url)) {
    errors.push(`${prefix} 'image.url' inválida`);
  }

  if (embed.thumbnail?.url && !isValidUrl(embed.thumbnail.url)) {
    errors.push(`${prefix} 'thumbnail.url' inválida`);
  }

  if (embed.footer?.text && embed.footer.text.length > EMBED_LIMITS.footerText) {
    errors.push(`${prefix} 'footer.text' excede ${EMBED_LIMITS.footerText} caracteres`);
  }
  if (embed.footer?.iconURL && !isValidUrl(embed.footer.iconURL)) {
    errors.push(`${prefix} 'footer.iconURL' inválida`);
  }

  if (embed.author?.name && embed.author.name.length > EMBED_LIMITS.authorName) {
    errors.push(`${prefix} 'author.name' excede ${EMBED_LIMITS.authorName} caracteres`);
  }
  if (embed.author?.url && !isValidUrl(embed.author.url)) {
    errors.push(`${prefix} 'author.url' inválida`);
  }
  if (embed.author?.iconURL && !isValidUrl(embed.author.iconURL)) {
    errors.push(`${prefix} 'author.iconURL' inválida`);
  }

  if (embed.fields !== undefined) {
    if (!Array.isArray(embed.fields)) {
      errors.push(`${prefix} 'fields' deve ser uma lista`);
    } else if (embed.fields.length > MAX_FIELDS_PER_EMBED) {
      errors.push(`${prefix} excede ${MAX_FIELDS_PER_EMBED} campos`);
    } else {
      embed.fields.forEach((field, fieldIndex) => {
        const fieldPrefix = `${prefix} campo #${fieldIndex + 1}:`;
        if (!field || typeof field !== "object") {
          errors.push(`${fieldPrefix} deve ser um objeto`);
          return;
        }
        if (!field.name?.trim()) {
          errors.push(`${fieldPrefix} 'name' é obrigatório`);
        } else if (field.name.length > EMBED_LIMITS.fieldName) {
          errors.push(`${fieldPrefix} 'name' excede ${EMBED_LIMITS.fieldName} caracteres`);
        }
        if (!field.value?.trim()) {
          errors.push(`${fieldPrefix} 'value' é obrigatório`);
        } else if (field.value.length > EMBED_LIMITS.fieldValue) {
          errors.push(`${fieldPrefix} 'value' excede ${EMBED_LIMITS.fieldValue} caracteres`);
        }
      });
    }
  }

  return errors;
}

// Strips fields the client shouldn't be able to set directly, and trims
// strings. Call this right before writing to the database.
export function sanitizeWelcomeConfig(body) {
  const defaults = createDefaultWelcomeConfig();

  return {
    enabled: !!body.enabled,
    webhookUrl: typeof body.webhookUrl === "string" ? body.webhookUrl.trim() : "",
    flags:
      body.flags === MESSAGE_FLAGS.COMPONENTS_V2
        ? MESSAGE_FLAGS.COMPONENTS_V2
        : MESSAGE_FLAGS.DEFAULT,
    message: {
      content:
        typeof body.message?.content === "string"
          ? body.message.content.slice(0, MAX_CONTENT_LENGTH)
          : defaults.message.content,
      embeds: Array.isArray(body.message?.embeds)
        ? body.message.embeds.slice(0, MAX_EMBEDS).map(sanitizeEmbed)
        : [],
      components: Array.isArray(body.message?.components) ? body.message.components : [],
    },
  };
}

// Cleans/clamps a single embed object before persisting it. Always returns
// a fully-shaped embed object so the editor never has to deal with missing
// nested keys.
export function sanitizeEmbed(embed) {
  const empty = createEmptyEmbed();
  if (!embed || typeof embed !== "object") return empty;

  return {
    title: typeof embed.title === "string" ? embed.title.slice(0, EMBED_LIMITS.title) : "",
    description:
      typeof embed.description === "string"
        ? embed.description.slice(0, EMBED_LIMITS.description)
        : "",
    url: typeof embed.url === "string" ? embed.url.trim() : "",
    color: isValidHexColor(embed.color) ? embed.color.trim() : DEFAULT_EMBED_COLOR,
    image: {
      url: typeof embed.image?.url === "string" ? embed.image.url.trim() : "",
    },
    thumbnail: {
      url: typeof embed.thumbnail?.url === "string" ? embed.thumbnail.url.trim() : "",
    },
    footer: {
      text:
        typeof embed.footer?.text === "string"
          ? embed.footer.text.slice(0, EMBED_LIMITS.footerText)
          : "",
      iconURL: typeof embed.footer?.iconURL === "string" ? embed.footer.iconURL.trim() : "",
    },
    author: {
      name:
        typeof embed.author?.name === "string"
          ? embed.author.name.slice(0, EMBED_LIMITS.authorName)
          : "",
      url: typeof embed.author?.url === "string" ? embed.author.url.trim() : "",
      iconURL: typeof embed.author?.iconURL === "string" ? embed.author.iconURL.trim() : "",
    },
    fields: Array.isArray(embed.fields)
      ? embed.fields.slice(0, MAX_FIELDS_PER_EMBED).map((field) => ({
          name: typeof field?.name === "string" ? field.name.slice(0, EMBED_LIMITS.fieldName) : "",
          value:
            typeof field?.value === "string" ? field.value.slice(0, EMBED_LIMITS.fieldValue) : "",
          inline: !!field?.inline,
        }))
      : [],
  };
}