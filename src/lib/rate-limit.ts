type Bucket = {
  count: number;
  resetAt: number;
  lockUntil: number;
  lastTouchedAt: number;
};

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, Bucket>();
const upstashLimiterCache = new Map<string, Ratelimit>();
const MAX_IN_MEMORY_BUCKETS = 10_000;
const BUCKET_IDLE_TTL_MS = 15 * 60_000;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisClient =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken
      })
    : null;

function cleanupBuckets(now: number) {
  if (buckets.size <= MAX_IN_MEMORY_BUCKETS) return;
  for (const [entryKey, entry] of buckets) {
    if (entry.resetAt < now || entry.lockUntil < now - BUCKET_IDLE_TTL_MS || entry.lastTouchedAt < now - BUCKET_IDLE_TTL_MS) {
      buckets.delete(entryKey);
    }
    if (buckets.size <= MAX_IN_MEMORY_BUCKETS) break;
  }
}

function simpleRateLimitInMemory(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  cleanupBuckets(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs, lockUntil: 0, lastTouchedAt: now });
    return { success: true, remaining: max - 1 };
  }

  if (existing.lockUntil > now) {
    return { success: false, remaining: 0 };
  }

  if (existing.count >= max) {
    existing.lockUntil = existing.resetAt;
    existing.lastTouchedAt = now;
    buckets.set(key, existing);
    return { success: false, remaining: 0 };
  }

  existing.count += 1;
  existing.lastTouchedAt = now;
  buckets.set(key, existing);
  return { success: true, remaining: max - existing.count };
}

function getUpstashLimiter(max: number, windowMs: number) {
  if (!redisClient) return null;
  const bucketWindowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${max}:${bucketWindowSec}`;
  const cached = upstashLimiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(max, `${bucketWindowSec} s`),
    analytics: true,
    prefix: "ecolingua:ratelimit"
  });
  upstashLimiterCache.set(cacheKey, limiter);
  return limiter;
}

export async function simpleRateLimit(key: string, max = 10, windowMs = 60_000) {
  const upstashLimiter = getUpstashLimiter(max, windowMs);
  if (!upstashLimiter) {
    return simpleRateLimitInMemory(key, max, windowMs);
  }

  try {
    const result = await upstashLimiter.limit(key);
    return { success: result.success, remaining: result.remaining };
  } catch {
    return simpleRateLimitInMemory(key, max, windowMs);
  }
}
