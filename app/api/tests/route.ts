import { listTests } from "@/features/student/service";
import { listTeacherTests } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, _context, session) => {
  if (session.role === "PRINCIPAL") return Response.json(await listTeacherTests(null));
  if (session.role === "TEACHER") return Response.json(await listTeacherTests(session.userId));
  return Response.json(await listTests(session.userId));
});
