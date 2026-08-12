import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { readExpeditions, writeExpeditions } from "@/lib/expeditionStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";

export async function PUT(request: Request, ctx: RouteContext<"/api/expeditions/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = expeditionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid expedition", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const expeditions = await readExpeditions();
  const idx = expeditions.findIndex((e) => e.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  if (parsed.data.slug !== slug && expeditions.some((e) => e.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  expeditions[idx] = parsed.data;
  await writeExpeditions(expeditions);
  return Response.json({ ok: true, expedition: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/expeditions/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const expeditions = await readExpeditions();
  const idx = expeditions.findIndex((e) => e.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  const [expedition] = expeditions.splice(idx, 1);
  await writeExpeditions(expeditions);
  await deleteBlobRefs([expedition.image, ...(expedition.gallery ?? [])]);
  return Response.json({ ok: true });
}
