type Bucket = {
  count: number;
  resetAt: number;
  lockUntil: number;
  lastTouchedAt: number;
};

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbBucketRow = {
  count: number;
  resetAt: Date;
  lockUntil: Date;
};

const buckets = new Map<string, Bucket>();
const MAX_IN_MEMORY_BUCKETS = 10_000;
const BUCKET_IDLE_TTL_MS = 15 * 60_000;
const DB_CLEANUP_INTERVAL_MS = 5 * 60_000;
const DB_FALLBACK_COOLDOWN_MS = 60_000;
const SQL_EPOCH = new Date(0);

let lastDbCleanupAt = 0;
let dbFallbackUntil = 0;
let hasLoggedDbFallback = false;
let hasLoggedDbRecovery = false;

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

function isDbLimiterEnabled() {
  return Boolean(process.env.POSTGRES_PRISMA_URL);
}

async function cleanupDbBuckets(nowMs: number) {
  if (nowMs - lastDbCleanupAt < DB_CLEANUP_INTERVAL_MS) return;
  lastDbCleanupAt = nowMs;

  const staleBeforeMs = nowMs - BUCKET_IDLE_TTL_MS;
  try {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "RateLimitBucket"
      WHERE "resetAt" < to_timestamp(${staleBeforeMs}::double precision / 1000.0)
        AND "lockUntil" < to_timestamp(${staleBeforeMs}::double precision / 1000.0)
    `);
  } catch {
    // Keep request path resilient if cleanup query fails.
  }
}

async function simpleRateLimitInDatabase(key: string, max: number, windowMs: number) {
  const now = new Date();
  const rows = await prisma.$queryRaw<DbBucketRow[]>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "lockUntil", "updatedAt")
    VALUES (
      ${key},
      1,
      NOW() + (${windowMs}::double precision / 1000.0) * INTERVAL '1 second',
      ${SQL_EPOCH},
      NOW()
    )
    ON CONFLICT ("key")
    DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        WHEN "RateLimitBucket"."lockUntil" > NOW() THEN "RateLimitBucket"."count"
        WHEN "RateLimitBucket"."count" >= ${max} THEN "RateLimitBucket"."count"
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN NOW() + (${windowMs}::double precision / 1000.0) * INTERVAL '1 second'
        ELSE "RateLimitBucket"."resetAt"
      END,
      "lockUntil" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${SQL_EPOCH}
        WHEN "RateLimitBucket"."lockUntil" > NOW() THEN "RateLimitBucket"."lockUntil"
        WHEN "RateLimitBucket"."count" >= ${max} THEN "RateLimitBucket"."resetAt"
        ELSE "RateLimitBucket"."lockUntil"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt", "lockUntil"
  `);

  const bucket = rows[0];
  if (!bucket) return { success: false, remaining: 0 };
  const isLocked = bucket.lockUntil.getTime() > now.getTime();
  if (isLocked) return { success: false, remaining: 0 };
  return { success: true, remaining: Math.max(0, max - bucket.count) };
}

export async function simpleRateLimit(key: string, max = 10, windowMs = 60_000) {
  const normalizedKey = key.trim();
  const normalizedMax = Math.max(1, Math.floor(max));
  const normalizedWindowMs = Math.max(1, Math.floor(windowMs));

  if (!normalizedKey) {
    return { success: false, remaining: 0 };
  }

  const nowMs = Date.now();
  if (isDbLimiterEnabled() && nowMs >= dbFallbackUntil) {
    try {
      const result = await simpleRateLimitInDatabase(normalizedKey, normalizedMax, normalizedWindowMs);
      void cleanupDbBuckets(nowMs);

      if (hasLoggedDbFallback && !hasLoggedDbRecovery) {
        hasLoggedDbRecovery = true;
        hasLoggedDbFallback = false;
        console.info("[rate-limit] DB limiter recovered; using PostgreSQL-backed limiter.");
      }

      return result;
    } catch {
      // Missing migration or temporary DB issue: fail open to in-memory and retry DB later.
      dbFallbackUntil = nowMs + DB_FALLBACK_COOLDOWN_MS;
      if (!hasLoggedDbFallback) {
        hasLoggedDbFallback = true;
        hasLoggedDbRecovery = false;
        console.warn("[rate-limit] DB limiter unavailable; temporarily falling back to in-memory limiter.");
      }
    }
  }

  return simpleRateLimitInMemory(normalizedKey, normalizedMax, normalizedWindowMs);
}
