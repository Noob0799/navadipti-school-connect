import { setTeacherStatus } from "@/features/teachers/service";
import { teacherStatusSchema } from "@/features/teachers/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const { active } = await parseBody(request, teacherStatusSchema);
  return Response.json(await setTeacherStatus(id, active));
});
