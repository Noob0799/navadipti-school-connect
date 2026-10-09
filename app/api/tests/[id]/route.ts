import { getTest } from "@/features/student/service";
import { getTeacherTest, updateTest } from "@/features/teacher/service";
import { testUpdateSchema } from "@/features/teacher/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, { params }, session) => {
  const { id } = await params;
  if (session.role === "PRINCIPAL") return Response.json(await getTeacherTest(null, id));
  if (session.role === "TEACHER") return Response.json(await getTeacherTest(session.userId, id));
  return Response.json(await getTest(id, session.userId));
});

export const PATCH = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id } = await params;
  const input = await parseBody(request, testUpdateSchema);
  await updateTest(session.userId, id, input);
  return Response.json(await getTeacherTest(session.userId, id));
});
