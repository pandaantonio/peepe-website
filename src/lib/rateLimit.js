// lib/rateLimit.js
// Simple in-memory rate limiter. Good enough for a single-instance deploy;
// swap the Map for Redis (e.g. Upstash) if you run multiple instances.

const buckets = new Map();

/**
 * @param {string} key - unique key (e.g. `${guildId}:${ip}:save`)
 * @param {number} limit - max requests allowed in the window
 * @param {number} windowMs - window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.start + windowMs - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}