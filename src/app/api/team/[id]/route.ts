import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { teamMemberSchema } from "@/lib/teamSchema";
import { listTeamMembers, updateTeamMember, deleteTeamMember } from "@/lib/teamStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";

export async function PUT(request: Request, ctx: RouteContext<"/api/team/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid team member", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const existing = await listTeamMembers();
  if (!existing.some((m) => m.id === id)) {
    return Response.json({ ok: false, error: "Team member not found" }, { status: 404 });
  }
  if (parsed.data.id !== id && existing.some((m) => m.id === parsed.data.id)) {
    return Response.json({ ok: false, error: "A team member with that id already exists" }, { status: 409 });
  }
  await updateTeamMember(id, parsed.data);
  revalidateTag("team", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/about");
  return Response.json({ ok: true, member: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/team/[id]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const removed = await deleteTeamMember(id);
  if (!removed) {
    return Response.json({ ok: false, error: "Team member not found" }, { status: 404 });
  }
  revalidateTag("team", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/about");
  await deleteBlobRefs(removed.photo);
  return Response.json({ ok: true });
}
