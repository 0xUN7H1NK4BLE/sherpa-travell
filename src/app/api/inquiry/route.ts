import { z } from "zod";
import { insertInquiry } from "@/lib/inquiryStore";

const inquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  trek: z.string().max(120).optional(),
  dates: z.string().max(200).optional(),
  groupSize: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),
});

// Simple in-memory rate limiter per client IP, matching the pattern in
// src/app/api/admin/login/route.ts. Best-effort in serverless (per-instance)
// but stops casual spam against a single instance.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const nextCount = (record?.count ?? 0) + 1;
  attempts.set(ip, { count: nextCount, until: now + WINDOW_MS });

  const created = await insertInquiry(parsed.data);
  return Response.json({ ok: true, id: created.id });
}
