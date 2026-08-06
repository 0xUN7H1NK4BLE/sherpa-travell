import { del, get } from "@vercel/blob";
import { isAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");
  if (!pathname) {
    return new Response("Missing pathname", { status: 400 });
  }

  const token =
    process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response("Blob token not configured", { status: 500 });
  }

  try {
    const result = await get(pathname, { access: "private", token });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(result.stream as ReadableStream, {
      headers: {
        "content-type": result.blob.contentType ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response((error as Error).message, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");
  if (!pathname) {
    return Response.json({ ok: false, error: "Missing pathname" }, { status: 400 });
  }
  const token =
    process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: "Blob token not configured" }, { status: 500 });
  }
  try {
    await del(pathname, { token });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}