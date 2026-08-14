import { revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { galleryFilmSchema, gallerySceneSchema } from "@/lib/gallerySchema";
import { listGalleryContent, insertScene, insertFilm } from "@/lib/galleryStore";

const kindSchema = z.enum(["scene", "video"]);

export async function GET() {
  const content = await listGalleryContent();
  return Response.json({ ok: true, content });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
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
    if (content.scenes.some((s) => s.id === parsed.data.id)) {
      return Response.json({ ok: false, error: "A scene with that id already exists" }, { status: 409 });
    }
    await insertScene(parsed.data);
    revalidateTag("gallery", { expire: 0 });
    return Response.json({ ok: true, item: parsed.data });
  }

  const parsed = galleryFilmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid video", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  if (content.videos.some((v) => v.id === parsed.data.id)) {
    return Response.json({ ok: false, error: "A video with that id already exists" }, { status: 409 });
  }
  await insertFilm(parsed.data);
  revalidateTag("gallery", { expire: 0 });
  return Response.json({ ok: true, item: parsed.data });
}
