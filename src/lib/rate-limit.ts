type Bucket = {
  count: number;
  resetAt: number;
};

type AuthFailureBucket = {
  failures: number;
  windowResetAt: number;
  lockUntil: number;
};

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, Bucket>();
const authFailureBuckets = new Map<string, AuthFailureBucket>();
const upstashLimiterCache = new Map<string, Ratelimit>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisClient =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken
      })
    : null;

function simpleRateLimitInMemory(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return { success: false, remaining: 0 };
  }

  existing.count += 1;
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

type AuthLockStatus = {
  locked: boolean;
  retryAfterMs: number;
};

const AUTH_FAILURE_PREFIX = "ecolingua:auth-failure";
const AUTH_LOCK_PREFIX = "ecolingua:auth-lock";

function normalizeSecurityKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "");
}

function authFailureKey(key: string) {
  return `${AUTH_FAILURE_PREFIX}:${normalizeSecurityKey(key)}`;
}

function authLockKey(key: string) {
  return `${AUTH_LOCK_PREFIX}:${normalizeSecurityKey(key)}`;
}

function authLockStatusFromInMemory(key: string): AuthLockStatus {
  const now = Date.now();
  const bucket = authFailureBuckets.get(key);
  if (!bucket) return { locked: false, retryAfterMs: 0 };
  if (bucket.lockUntil > now) return { locked: true, retryAfterMs: bucket.lockUntil - now };
  return { locked: false, retryAfterMs: 0 };
}

function registerAuthFailureInMemory(
  key: string,
  {
    maxFailures,
    windowMs,
    lockMs
  }: { maxFailures: number; windowMs: number; lockMs: number }
): AuthLockStatus & { failures: number } {
  const now = Date.now();
  const existing = authFailureBuckets.get(key);
  const bucket: AuthFailureBucket =
    !existing || existing.windowResetAt <= now
      ? { failures: 1, windowResetAt: now + windowMs, lockUntil: 0 }
      : { ...existing, failures: existing.failures + 1 };

  if (bucket.failures >= maxFailures) {
    bucket.lockUntil = now + lockMs;
    bucket.failures = 0;
    bucket.windowResetAt = now + windowMs;
  }
  authFailureBuckets.set(key, bucket);
  const retryAfterMs = Math.max(0, bucket.lockUntil - now);
  return { locked: retryAfterMs > 0, retryAfterMs, failures: bucket.failures };
}

export async function getAuthLockStatus(key: string): Promise<AuthLockStatus> {
  const failureKey = authFailureKey(key);
  const lockKey = authLockKey(key);

  if (!redisClient) return authLockStatusFromInMemory(failureKey);

  try {
    const lockUntilRaw = await redisClient.get<number | string | null>(lockKey);
    const lockUntil = Number(lockUntilRaw || 0);
    const retryAfterMs = lockUntil - Date.now();
    if (retryAfterMs > 0) return { locked: true, retryAfterMs };
    return { locked: false, retryAfterMs: 0 };
  } catch {
    return authLockStatusFromInMemory(failureKey);
  }
}

export async function clearAuthFailures(key: string) {
  const failureKey = authFailureKey(key);
  const lockKey = authLockKey(key);

  authFailureBuckets.delete(failureKey);

  if (!redisClient) return;
  try {
    await redisClient.del(failureKey, lockKey);
  } catch {
    // Ignore transient cleanup issues.
  }
}

export async function registerAuthFailure(
  key: string,
  {
    maxFailures = 5,
    windowMs = 15 * 60_000,
    lockMs = 15 * 60_000
  }: { maxFailures?: number; windowMs?: number; lockMs?: number } = {}
): Promise<AuthLockStatus & { failures: number }> {
  const failureKey = authFailureKey(key);
  const lockKey = authLockKey(key);
  const now = Date.now();

  if (!redisClient) {
    return registerAuthFailureInMemory(failureKey, { maxFailures, windowMs, lockMs });
  }

  try {
    const existingLockUntilRaw = await redisClient.get<number | string | null>(lockKey);
    const existingLockUntil = Number(existingLockUntilRaw || 0);
    const existingRetryAfterMs = existingLockUntil - now;
    if (existingRetryAfterMs > 0) {
      return { locked: true, retryAfterMs: existingRetryAfterMs, failures: maxFailures };
    }

    const failures = await redisClient.incr(failureKey);
    if (failures === 1) {
      await redisClient.expire(failureKey, Math.ceil(windowMs / 1000));
    }

    if (failures >= maxFailures) {
      const lockUntil = now + lockMs;
      await redisClient.set(lockKey, lockUntil, { px: lockMs });
      await redisClient.del(failureKey);
      return { locked: true, retryAfterMs: lockMs, failures };
    }

    return { locked: false, retryAfterMs: 0, failures };
  } catch {
    return registerAuthFailureInMemory(failureKey, { maxFailures, windowMs, lockMs });
  }
}
