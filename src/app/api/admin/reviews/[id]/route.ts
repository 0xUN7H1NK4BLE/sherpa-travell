import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { updateReviewApproval, deleteReview } from "@/lib/reviewStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";
import type { Review } from "@/lib/db/schema";

const approvalSchema = z.object({ approved: z.boolean() });

function revalidateForReview(review: Review) {
  revalidateTag("reviews", { expire: 0 });
  revalidatePath(review.subjectType === "trek" ? `/treks/${review.subjectSlug}` : `/expeditions/${review.subjectSlug}`);
  revalidatePath("/");
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/reviews/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const updated = await updateReviewApproval(numericId, parsed.data.approved);
  if (!updated) {
    return Response.json({ ok: false, error: "Review not found" }, { status: 404 });
  }
  revalidateForReview(updated);
  return Response.json({ ok: true, review: updated });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/reviews/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }
  const removed = await deleteReview(numericId);
  if (!removed) {
    return Response.json({ ok: false, error: "Review not found" }, { status: 404 });
  }
  revalidateForReview(removed);
  await deleteBlobRefs(removed.photoUrl ?? undefined);
  return Response.json({ ok: true });
}
