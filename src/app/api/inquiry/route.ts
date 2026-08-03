import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  trek: z.string().optional(),
  dates: z.string().optional(),
  groupSize: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  console.info("[inquiry]", parsed.data);

  return Response.json({ ok: true });
}
