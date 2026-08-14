import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { trekSchema } from "@/lib/trekSchema";
import { listTreks, insertTrek, getTrekBySlug } from "@/lib/trekStore";

export async function GET() {
  const treks = await listTreks();
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
  if (await getTrekBySlug(parsed.data.slug)) {
    return Response.json({ ok: false, error: "A trek with that slug already exists" }, { status: 409 });
  }
  await insertTrek(parsed.data);
  revalidateTag("treks", { expire: 0 });
  return Response.json({ ok: true, trek: parsed.data });
}
