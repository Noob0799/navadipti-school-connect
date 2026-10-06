import { getTeacher, updateTeacher } from "@/features/teachers/service";
import { teacherUpdateSchema } from "@/features/teachers/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  return Response.json(await getTeacher(id));
});

export const PATCH = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const input = await parseBody(request, teacherUpdateSchema);
  return Response.json(await updateTeacher(id, input));
});
