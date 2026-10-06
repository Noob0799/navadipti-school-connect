import { releaseGrades } from "@/features/teacher/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const POST = withRole<Context>(["TEACHER"], async (_request, { params }, session) => {
  const { id } = await params;
  return Response.json(await releaseGrades(session.userId, id));
});
