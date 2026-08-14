import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { galleryFilmSchema, gallerySceneSchema } from "@/lib/gallerySchema";
import { listGalleryContent, updateScene, updateFilm, deleteScene, deleteFilm } from "@/lib/galleryStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";

const kindSchema = z.enum(["scene", "video"]);

export async function PUT(request: Request, ctx: RouteContext<"/api/gallery/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const kind = kindSchema.safeParse(body?.kind);
  if (!kind.success) {
    return Response.json({ ok: false, error: "kind must be 'scene' or 'video'" }, { status: 400 });
  }

  const content = await listGalleryContent();

  if (kind.data === "scene") {
    const parsed = gallerySceneSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ ok: false, error: "Invalid scene", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
    }
    if (!content.scenes.some((s) => s.id === id)) {
      return Response.json({ ok: false, error: "Scene not found" }, { status: 404 });
    }
    if (parsed.data.id !== id && content.scenes.some((s) => s.id === parsed.data.id)) {
      return Response.json({ ok: false, error: "A scene with that id already exists" }, { status: 409 });
    }
    await updateScene(id, parsed.data);
    revalidateTag("gallery", { expire: 0 });
    return Response.json({ ok: true, item: parsed.data });
  }

  const parsed = galleryFilmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid video", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  if (!content.videos.some((v) => v.id === id)) {
    return Response.json({ ok: false, error: "Video not found" }, { status: 404 });
  }
  if (parsed.data.id !== id && content.videos.some((v) => v.id === parsed.data.id)) {
    return Response.json({ ok: false, error: "A video with that id already exists" }, { status: 409 });
  }
  await updateFilm(id, parsed.data);
  revalidateTag("gallery", { expire: 0 });
  return Response.json({ ok: true, item: parsed.data });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/gallery/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const kind = kindSchema.safeParse(searchParams.get("kind"));
  if (!kind.success) {
    return Response.json({ ok: false, error: "kind must be 'scene' or 'video'" }, { status: 400 });
  }

  if (kind.data === "scene") {
    const removed = await deleteScene(id);
    if (!removed) {
      return Response.json({ ok: false, error: "Scene not found" }, { status: 404 });
    }
    revalidateTag("gallery", { expire: 0 });
    await deleteBlobRefs(removed.src);
    return Response.json({ ok: true });
  } else {
    const removed = await deleteFilm(id);
    if (!removed) {
      return Response.json({ ok: false, error: "Video not found" }, { status: 404 });
    }
    revalidateTag("gallery", { expire: 0 });
    await deleteBlobRefs([removed.src, removed.poster]);
    return Response.json({ ok: true });
  }
}
