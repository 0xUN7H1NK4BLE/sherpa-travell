import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { trekSchema } from "@/lib/trekSchema";
import { getTrekBySlug, updateTrek, deleteTrek } from "@/lib/trekStore";
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
  const existing = await getTrekBySlug(slug);
  if (!existing) {
    return Response.json({ ok: false, error: "Trek not found" }, { status: 404 });
  }
  if (parsed.data.slug !== slug && (await getTrekBySlug(parsed.data.slug))) {
    return Response.json({ ok: false, error: "A trek with that slug already exists" }, { status: 409 });
  }
  await updateTrek(slug, parsed.data);
  revalidateTag("treks", { expire: 0 });
  return Response.json({ ok: true, trek: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/treks/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const existing = await getTrekBySlug(slug);
  if (!existing) {
    return Response.json({ ok: false, error: "Trek not found" }, { status: 404 });
  }
  await deleteTrek(slug);
  revalidateTag("treks", { expire: 0 });
  await deleteBlobRefs([existing.image, ...(existing.gallery ?? [])]);
  return Response.json({ ok: true });
}
