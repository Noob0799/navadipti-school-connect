import { createHomework } from "@/features/teacher/service";
import { homeworkInputSchema } from "@/features/teacher/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const POST = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id } = await params;
  const input = await parseBody(request, homeworkInputSchema.omit({ offeringSubjectId: true }));
  const homeworkId = await createHomework(session.userId, { ...input, offeringSubjectId: id });
  return Response.json({ id: homeworkId }, { status: 201 });
});
