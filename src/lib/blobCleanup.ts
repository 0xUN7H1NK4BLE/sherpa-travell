import { del } from "@vercel/blob";

// Deletes uploaded blob files referenced by same-origin /api/blob URLs.
// Accepts a single URL or an array; silently skips non-blob references
// (e.g. local /images/... paths) and empty values.
export async function deleteBlobRefs(refs: Array<string | undefined> | string | undefined) {
  const list = (Array.isArray(refs) ? refs : [refs]).filter(
    (r): r is string => typeof r === "string" && r.startsWith("/api/blob?pathname="),
  );
  if (list.length === 0) return;

  const token =
    process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  const pathnames = list
    .map((r) => new URLSearchParams(r.split("?")[1] ?? "").get("pathname"))
    .filter((p): p is string => !!p);

  try {
    await del(pathnames, { token });
  } catch {
    // Best-effort: never fail the parent delete because blob cleanup failed.
  }
}
