import { enrollStudent, listStudents } from "@/features/students/service";
import { enrollStudentSchema } from "@/features/students/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  return Response.json(await listStudents());
});

export const POST = withRole(["PRINCIPAL"], async (request) => {
  const input = await parseBody(request, enrollStudentSchema);
  const result = await enrollStudent(input);
  return Response.json(result, { status: 201 });
});
