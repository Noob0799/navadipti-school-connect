import { setHomeworkRemark } from "@/features/teacher/service";
import { remarkSchema } from "@/features/teacher/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["TEACHER"], async (request, { params }, session) => {
  const { id } = await params;
  const { remark } = await parseBody(request, remarkSchema);
  await setHomeworkRemark(session.userId, id, remark);
  return Response.json({ ok: true });
});
