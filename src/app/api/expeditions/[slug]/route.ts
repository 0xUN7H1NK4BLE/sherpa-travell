import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { getExpeditionBySlug, updateExpedition, deleteExpedition } from "@/lib/expeditionStore";
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
  const existing = await getExpeditionBySlug(slug);
  if (!existing) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  if (parsed.data.slug !== slug && (await getExpeditionBySlug(parsed.data.slug))) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  await updateExpedition(slug, parsed.data);
  revalidateTag("expeditions", { expire: 0 });
  return Response.json({ ok: true, expedition: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/expeditions/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const existing = await getExpeditionBySlug(slug);
  if (!existing) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  await deleteExpedition(slug);
  revalidateTag("expeditions", { expire: 0 });
  await deleteBlobRefs([existing.image, ...(existing.gallery ?? [])]);
  return Response.json({ ok: true });
}
