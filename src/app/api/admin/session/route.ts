import { isAuthenticated } from "@/lib/adminAuth";

export async function GET() {
  const authed = await isAuthenticated();
  return Response.json({ ok: authed });
}
