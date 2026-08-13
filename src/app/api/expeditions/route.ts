import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { readExpeditions, writeExpeditions } from "@/lib/expeditionStore";

export async function GET() {
  const expeditions = await readExpeditions();
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
  const expeditions = await readExpeditions();
  if (expeditions.some((e) => e.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  expeditions.push(parsed.data);
  await writeExpeditions(expeditions);
  return Response.json({ ok: true, expedition: parsed.data });
}
