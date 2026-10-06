import { listNotifications } from "@/features/student/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["STUDENT", "TEACHER"], async (_request, _context, session) => {
  return Response.json(await listNotifications(session.userId));
});
