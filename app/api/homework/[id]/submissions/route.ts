import { submitHomework } from "@/features/student/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const POST = withRole<Context>(["STUDENT"], async (_request, { params }, session) => {
  const { id } = await params;
  return Response.json(await submitHomework(id, session.userId));
});
