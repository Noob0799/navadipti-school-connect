import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(1),
  password: z.string().min(1),
});

const UNKNOWN_USER_HASH = bcrypt.hashSync("unknown-user", 10);

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter your phone number and password." }, { status: 400 });
  }

  const { phoneNumber, password } = parsed.data;
  const user = await db.user.findUnique({ where: { phoneNumber } });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? UNKNOWN_USER_HASH);

  if (!user || user.status !== "ACTIVE" || !passwordMatches) {
    return Response.json({ error: "Wrong phone number or password." }, { status: 401 });
  }

  await setSessionCookie(await createSessionToken(user.id, user.role));
  return Response.json({ role: user.role });
}
