import { z } from "zod";
import {
  adminCredentials,
  newSessionToken,
  sessionCookieName,
} from "@/lib/adminAuth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const { username, password } = parsed.data;
  if (
    username !== adminCredentials.username ||
    password !== adminCredentials.password
  ) {
    return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${sessionCookieName}=${newSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
  );
  return res;
}
