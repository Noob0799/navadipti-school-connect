import { gradeSubmission } from "@/features/teacher/service";
import { gradeSchema } from "@/features/teacher/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id } = await params;
  const input = await parseBody(request, gradeSchema);
  await gradeSubmission(session.userId, id, input);
  return Response.json({ ok: true });
});
