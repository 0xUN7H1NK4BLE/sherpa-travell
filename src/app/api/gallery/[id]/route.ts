import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { galleryFilmSchema, gallerySceneSchema } from "@/lib/gallerySchema";
import { readGallery, writeGallery } from "@/lib/galleryStore";

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

  const content = await readGallery();

  if (kind.data === "scene") {
    const parsed = gallerySceneSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ ok: false, error: "Invalid scene", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
    }
    const idx = content.scenes.findIndex((s) => s.id === id);
    if (idx === -1) return Response.json({ ok: false, error: "Scene not found" }, { status: 404 });
    if (parsed.data.id !== id && content.scenes.some((s) => s.id === parsed.data.id)) {
      return Response.json({ ok: false, error: "A scene with that id already exists" }, { status: 409 });
    }
    content.scenes[idx] = parsed.data;
    await writeGallery(content);
    return Response.json({ ok: true, item: parsed.data });
  }

  const parsed = galleryFilmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid video", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const idx = content.videos.findIndex((v) => v.id === id);
  if (idx === -1) return Response.json({ ok: false, error: "Video not found" }, { status: 404 });
  if (parsed.data.id !== id && content.videos.some((v) => v.id === parsed.data.id)) {
    return Response.json({ ok: false, error: "A video with that id already exists" }, { status: 409 });
  }
  content.videos[idx] = parsed.data;
  await writeGallery(content);
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

  const content = await readGallery();

  if (kind.data === "scene") {
    const next = content.scenes.filter((s) => s.id !== id);
    if (next.length === content.scenes.length) {
      return Response.json({ ok: false, error: "Scene not found" }, { status: 404 });
    }
    content.scenes = next;
  } else {
    const next = content.videos.filter((v) => v.id !== id);
    if (next.length === content.videos.length) {
      return Response.json({ ok: false, error: "Video not found" }, { status: 404 });
    }
    content.videos = next;
  }

  await writeGallery(content);
  return Response.json({ ok: true });
}
