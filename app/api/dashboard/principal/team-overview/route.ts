import { principalTeamOverview } from "@/features/principal/service";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  return Response.json(await principalTeamOverview());
});
