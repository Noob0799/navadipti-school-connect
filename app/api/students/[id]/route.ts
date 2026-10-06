import { getStudent, updateStudent } from "@/features/students/service";
import { updateStudentSchema } from "@/features/students/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  return Response.json(await getStudent(id));
});

export const PATCH = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const input = await parseBody(request, updateStudentSchema);
  return Response.json(await updateStudent(id, input));
});
