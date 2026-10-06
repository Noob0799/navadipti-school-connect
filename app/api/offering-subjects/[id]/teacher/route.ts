import { z } from "zod";
import { assignTeacher, unassignTeacher } from "@/features/teachers/service";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

const assignSchema = z.object({ teacherId: z.string().min(1, "Choose a teacher") });

export const PUT = withRole<Context>(["PRINCIPAL"], async (request, { params }) => {
  const { id } = await params;
  const { teacherId } = await parseBody(request, assignSchema);
  await assignTeacher(id, teacherId);
  return Response.json({ ok: true });
});

export const DELETE = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  await unassignTeacher(id);
  return Response.json({ ok: true });
});
