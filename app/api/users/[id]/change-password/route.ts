import { changeOwnPassword } from "@/features/accounts/service";
import { changePasswordSchema } from "@/features/accounts/schemas";
import { HttpError } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["STUDENT", "TEACHER", "PRINCIPAL"], async (request, { params }, session) => {
  const { id } = await params;
  if (id !== session.userId) throw new HttpError(403, "You can only change your own password.");
  const { currentPassword, newPassword } = await parseBody(request, changePasswordSchema);
  await changeOwnPassword(session.userId, currentPassword, newPassword);
  return Response.json({ ok: true });
});
