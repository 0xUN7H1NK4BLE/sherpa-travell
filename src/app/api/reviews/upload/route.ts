import { put } from "@vercel/blob";
import { clientIp, rateLimited } from "@/lib/rateLimit";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// Lightweight magic-byte sniffing so a spoofed Content-Type alone can't pass.
function sniffImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return true; // PNG
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return true; // WebP
  if (buf.subarray(0, 3).toString("ascii") === "GIF8") return true; // GIF
  if (
    buf.subarray(4, 8).toString("ascii") === "ftyp" &&
    /^(avif|avis)/.test(buf.subarray(8, 12).toString("ascii"))
  )
    return true; // AVIF
  return false;
}

// Public, unauthenticated upload for review photos — rate-limited instead of
// admin-gated. Stored under uploads/reviews/ to keep distinguishable from
// admin-managed uploads.
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateLimited(ip, { windowMs: WINDOW_MS, max: MAX_ATTEMPTS })) {
    return Response.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429 },
    );
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
  if (!sniffImage(bytes)) {
    return Response.json(
      { ok: false, error: "File does not look like an image" },
      { status: 415 },
    );
  }
  const pathname = `uploads/reviews/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  try {
    const result = await put(pathname, bytes, {
      access: "private",
      token,
      contentType: file.type,
      addRandomSuffix: true,
      allowOverwrite: true,
    });

    const url = `/api/blob?pathname=${encodeURIComponent(result.pathname)}`;
    return Response.json({ ok: true, url });
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
