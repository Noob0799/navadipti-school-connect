import { getHomework } from "@/features/student/service";
import { getTeacherHomework, updateHomework } from "@/features/teacher/service";
import { homeworkUpdateSchema } from "@/features/teacher/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, { params }, session) => {
  const { id } = await params;
  if (session.role === "PRINCIPAL") return Response.json(await getTeacherHomework(null, id));
  if (session.role === "TEACHER") return Response.json(await getTeacherHomework(session.userId, id));
  return Response.json(await getHomework(id, session.userId));
});

export const PATCH = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id } = await params;
  const input = await parseBody(request, homeworkUpdateSchema);
  await updateHomework(session.userId, id, input);
  return Response.json(await getTeacherHomework(session.userId, id));
});
