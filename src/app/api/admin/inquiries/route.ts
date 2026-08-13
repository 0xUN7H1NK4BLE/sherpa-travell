import { isAuthenticated } from "@/lib/adminAuth";
import { listInquiries } from "@/lib/inquiryStore";

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await listInquiries();
  return Response.json({ ok: true, inquiries });
}
