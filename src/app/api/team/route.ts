import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { teamMemberSchema } from "@/lib/teamSchema";
import { listTeamMembers, insertTeamMember } from "@/lib/teamStore";

export async function GET() {
  const members = await listTeamMembers();
  return Response.json({ ok: true, members });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid team member", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const existing = await listTeamMembers();
  if (existing.some((m) => m.id === parsed.data.id)) {
    return Response.json({ ok: false, error: "A team member with that id already exists" }, { status: 409 });
  }
  await insertTeamMember(parsed.data);
  revalidateTag("team", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/about");
  return Response.json({ ok: true, member: parsed.data });
}
