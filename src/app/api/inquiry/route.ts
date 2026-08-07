import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  trek: z.string().max(120).optional(),
  dates: z.string().max(200).optional(),
  groupSize: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),
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
