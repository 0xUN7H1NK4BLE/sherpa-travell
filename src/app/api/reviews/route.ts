import { insertReview } from "@/lib/reviewStore";
import { reviewSubmitSchema } from "@/lib/reviewSchema";
import { clientIp, rateLimited } from "@/lib/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateLimited(ip, { windowMs: WINDOW_MS, max: MAX_ATTEMPTS })) {
    return Response.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const created = await insertReview(parsed.data);
  return Response.json({ ok: true, id: created.id });
}
