import { listResults } from "@/features/student/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["STUDENT"], async (_request, _context, session) => {
  return Response.json(await listResults(session.userId));
});
