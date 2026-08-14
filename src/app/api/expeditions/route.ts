import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { listExpeditions, insertExpedition, getExpeditionBySlug } from "@/lib/expeditionStore";

export async function GET() {
  const expeditions = await listExpeditions();
  return Response.json({ ok: true, expeditions });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = expeditionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid expedition", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  if (await getExpeditionBySlug(parsed.data.slug)) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  await insertExpedition(parsed.data);
  revalidateTag("expeditions", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/expeditions");
  revalidatePath("/map");
  return Response.json({ ok: true, expedition: parsed.data });
}
