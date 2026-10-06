import { resetPassword } from "@/features/accounts/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  const temporaryPassword = await resetPassword(id);
  return Response.json({ temporaryPassword });
});
