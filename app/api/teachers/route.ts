import { createTeacher, listTeachers } from "@/features/teachers/service";
import { teacherInputSchema } from "@/features/teachers/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  return Response.json(await listTeachers());
});

export const POST = withRole(["PRINCIPAL"], async (request) => {
  const input = await parseBody(request, teacherInputSchema);
  const result = await createTeacher(input);
  return Response.json(result, { status: 201 });
});
