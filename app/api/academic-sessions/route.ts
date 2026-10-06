import { createNextSession, listSessions } from "@/features/sessions/service";
import { createSessionSchema } from "@/features/sessions/schemas";
import { parseBody } from "@/lib/http";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  return Response.json(await listSessions());
});

export const POST = withRole(["PRINCIPAL"], async (request) => {
  const { label } = await parseBody(request, createSessionSchema);
  await createNextSession(label);
  return Response.json(await listSessions(), { status: 201 });
});
