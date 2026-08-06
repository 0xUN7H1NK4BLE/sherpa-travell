import { put } from "@vercel/blob";
import { isAuthenticated } from "@/lib/adminAuth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const token =
    process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json({
      ok: false,
      error: "BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN is not configured",
    }, { status: 500 });
  }

  let file: File;
  try {
    const formData = await request.formData();
    const candidate = formData.get("file");
    if (!(candidate instanceof File)) {
      return Response.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    file = candidate;
  } catch {
    return Response.json(
      { ok: false, error: "Expected multipart/form-data" },
      { status: 415 },
    );
  }

  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { ok: false, error: `Content type ${file.type} not allowed` },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "File exceeds 10 MB limit" },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const pathname = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  try {
    const result = await put(pathname, bytes, {
      access: "public",
      token,
      contentType: file.type,
      addRandomSuffix: true,
      allowOverwrite: true,
    });

    return Response.json({ ok: true, url: result.url });
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
