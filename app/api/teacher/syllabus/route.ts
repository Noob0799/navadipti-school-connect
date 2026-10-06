import { listTeacherSyllabus } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["TEACHER"], async (_request, _context, session) => {
  return Response.json(await listTeacherSyllabus(session.userId));
});
