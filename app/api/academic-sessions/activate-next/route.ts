import { activateNextSession, listSessions } from "@/features/sessions/service";
import { withRole } from "@/lib/rbac";

export const POST = withRole(["PRINCIPAL"], async () => {
  const label = await activateNextSession();
  return Response.json({ activated: label, ...(await listSessions()) });
});
