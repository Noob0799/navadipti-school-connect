import { upsertSyllabus } from "@/features/teacher/service";
import { syllabusSchema, termNameSchema } from "@/features/teacher/schemas";
import { HttpError } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string; termName: string }> };

export const PUT = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id, termName } = await params;
  const term = termNameSchema.safeParse(termName);
  if (!term.success) throw new HttpError(400, "Unknown term.");
  const input = await parseBody(request, syllabusSchema);
  await upsertSyllabus(session.userId, id, term.data, input.content);
  return Response.json({ ok: true });
});
