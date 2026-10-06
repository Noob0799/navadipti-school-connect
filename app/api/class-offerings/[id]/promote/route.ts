import { promoteClass } from "@/features/promotion/service";
import { promoteSchema } from "@/features/students/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const POST = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const { promotedStudentIds } = await parseBody(request, promoteSchema);
  return Response.json(await promoteClass(id, promotedStudentIds));
});
