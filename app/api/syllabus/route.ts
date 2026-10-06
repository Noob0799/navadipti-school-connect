import { listSyllabus } from "@/features/student/service";
import { listTeacherSyllabus } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["STUDENT", "PRINCIPAL"], async (_request, _context, session) => {
  if (session.role === "PRINCIPAL") return Response.json(await listTeacherSyllabus(null));
  return Response.json(await listSyllabus(session.userId));
});
