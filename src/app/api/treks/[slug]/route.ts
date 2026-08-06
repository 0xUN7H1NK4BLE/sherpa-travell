import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { trekSchema } from "@/lib/trekSchema";
import { readTreks, writeTreks } from "@/lib/trekStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";

export async function PUT(request: Request, ctx: RouteContext<"/api/treks/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = trekSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid trek", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const treks = await readTreks();
  const idx = treks.findIndex((t) => t.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Trek not found" }, { status: 404 });
  }
  if (parsed.data.slug !== slug && treks.some((t) => t.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "A trek with that slug already exists" }, { status: 409 });
  }
  treks[idx] = parsed.data;
  await writeTreks(treks);
  return Response.json({ ok: true, trek: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/treks/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const treks = await readTreks();
  const idx = treks.findIndex((t) => t.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Trek not found" }, { status: 404 });
  }
  const [trek] = treks.splice(idx, 1);
  await writeTreks(treks);
  await deleteBlobRefs([trek.image, ...(trek.gallery ?? [])]);
  return Response.json({ ok: true });
}
