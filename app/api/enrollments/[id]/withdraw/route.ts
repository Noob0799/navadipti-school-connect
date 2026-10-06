import { withdrawEnrollment } from "@/features/students/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  await withdrawEnrollment(id);
  return Response.json({ ok: true });
});
