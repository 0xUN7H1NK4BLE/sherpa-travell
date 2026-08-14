const attempts = new Map<string, { count: number; until: number }>();

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "unknown").trim();
}

// Simple in-memory per-key rate limiter. Best-effort in serverless
// (per-instance) but stops casual spam against a single instance.
export function rateLimited(key: string, { windowMs, max }: { windowMs: number; max: number }): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (record && record.until > now && record.count >= max) return true;
  attempts.set(key, { count: (record?.count ?? 0) + 1, until: now + windowMs });
  return false;
}
