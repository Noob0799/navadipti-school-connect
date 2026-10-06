import { setExpertise } from "@/features/teachers/service";
import { expertiseSchema } from "@/features/teachers/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PUT = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const input = await parseBody(request, expertiseSchema);
  return Response.json(await setExpertise(id, input));
});
