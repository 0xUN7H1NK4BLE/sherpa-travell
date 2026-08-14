import { isAuthenticated } from "@/lib/adminAuth";
import { listReviews } from "@/lib/reviewStore";

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const reviews = await listReviews();
  return Response.json({ ok: true, reviews });
}
