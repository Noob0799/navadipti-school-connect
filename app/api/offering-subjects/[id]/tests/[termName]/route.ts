import { createOrUpdateTest } from "@/features/teacher/service";
import { termNameSchema, testInputSchema } from "@/features/teacher/schemas";
import { HttpError } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string; termName: string }> };

export const PUT = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id, termName } = await params;
  const term = termNameSchema.safeParse(termName);
  if (!term.success) throw new HttpError(400, "Unknown term.");
  const input = await parseBody(request, testInputSchema);
  const testId = await createOrUpdateTest(session.userId, id, term.data, input);
  return Response.json({ id: testId });
});
