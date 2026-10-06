import { deleteAttachment, readAttachment } from "@/features/attachments/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["STUDENT", "TEACHER", "PRINCIPAL"], async (_request, { params }, session) => {
  const { id } = await params;
  const file = await readAttachment(session, id);
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
});

export const DELETE = withRole<Context>(["STUDENT", "TEACHER"], async (_request, { params }, session) => {
  const { id } = await params;
  await deleteAttachment(session, id);
  return Response.json({ ok: true });
});
