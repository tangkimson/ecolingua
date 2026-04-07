type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function simpleRateLimit(key: string, max = 10, windowMs = 60_000) {
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
