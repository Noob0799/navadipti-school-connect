import { listClassOfferings } from "@/features/teachers/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  return Response.json(await listClassOfferings());
});
