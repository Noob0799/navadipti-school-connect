import { promotionReview } from "@/features/promotion/service";
import { withRole } from "@/lib/rbac";

type Context = { params: Promise<{ id: string }> };

export const GET = withRole<Context>(["PRINCIPAL"], async (_request, { params }) => {
  const { id } = await params;
  return Response.json(await promotionReview(id));
});
