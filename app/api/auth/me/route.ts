import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });

  const user = await db.user.findFirst({
    where: { id: session.userId, status: "ACTIVE" },
    select: { id: true, name: true, role: true, phoneNumber: true },
  });
  if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401 });

  return Response.json(user);
}
