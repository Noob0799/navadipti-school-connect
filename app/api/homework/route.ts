import { listHomework } from "@/features/student/service";
import { listTeacherHomework } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, _context, session) => {
  if (session.role === "PRINCIPAL") return Response.json(await listTeacherHomework(null));
  if (session.role === "TEACHER") return Response.json(await listTeacherHomework(session.userId));
  return Response.json(await listHomework(session.userId));
});
