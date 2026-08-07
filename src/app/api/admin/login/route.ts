import { z } from "zod";
import {
  adminCredentials,
  newSessionToken,
  sessionCookieName,
} from "@/lib/adminAuth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Simple in-memory rate limiter per client IP. Best-effort in serverless
// (per-instance), but stops casual brute-force against a single instance.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "unknown").trim();
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return Response.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const { username, password } = parsed.data;
  if (
    username !== adminCredentials.username ||
    password !== adminCredentials.password
  ) {
    const nextCount = (record?.count ?? 0) + 1;
    attempts.set(ip, { count: nextCount, until: now + WINDOW_MS });
    return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  attempts.delete(ip);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${sessionCookieName}=${newSessionToken()}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${60 * 60 * 24 * 7}`,
  );
  return res;
}
