import { markNotificationsRead } from "@/features/student/service";
import { withRole } from "@/lib/rbac";

export const POST = withRole(["STUDENT", "TEACHER"], async (_request, _context, session) => {
  return Response.json({ readAt: await markNotificationsRead(session.userId) });
});
