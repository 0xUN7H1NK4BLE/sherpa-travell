import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { trekSchema } from "@/lib/trekSchema";
import { readTreks, writeTreks } from "@/lib/trekStore";

export async function GET() {
  const treks = await readTreks();
  return Response.json({ ok: true, treks });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = trekSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid trek", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const treks = await readTreks();
  if (treks.some((t) => t.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "A trek with that slug already exists" }, { status: 409 });
  }
  treks.push(parsed.data);
  await writeTreks(treks);
  return Response.json({ ok: true, trek: parsed.data });
}
