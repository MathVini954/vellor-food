const buckets = new Map<string, number[]>();

function prune(bucket: number[], now: number, windowMs: number) {
  return bucket.filter((timestamp) => now - timestamp < windowMs);
}

export function consumeRateLimit(input: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const currentBucket = prune(buckets.get(input.key) ?? [], now, input.windowMs);

  if (currentBucket.length >= input.limit) {
    buckets.set(input.key, currentBucket);
    return false;
  }

  currentBucket.push(now);
  buckets.set(input.key, currentBucket);
  return true;
}

export function getRequestClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

