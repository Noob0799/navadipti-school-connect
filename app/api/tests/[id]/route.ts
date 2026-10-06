import { getTest } from "@/features/student/service";
import { getTeacherTest } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, { params }, session) => {
  const { id } = await params;
  if (session.role === "PRINCIPAL") return Response.json(await getTeacherTest(null, id));
  if (session.role === "TEACHER") return Response.json(await getTeacherTest(session.userId, id));
  return Response.json(await getTest(id, session.userId));
});
