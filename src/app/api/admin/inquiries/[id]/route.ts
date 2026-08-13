import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { updateInquiryStatus } from "@/lib/inquiryStore";

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/inquiries/[id]">,
) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }
  const updated = await updateInquiryStatus(numericId, parsed.data.status);
  if (!updated) {
    return Response.json({ ok: false, error: "Inquiry not found" }, { status: 404 });
  }
  return Response.json({ ok: true, inquiry: updated });
}
