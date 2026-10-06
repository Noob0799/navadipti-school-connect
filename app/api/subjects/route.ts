import { db } from "@/lib/db";
import { withRole } from "@/lib/rbac";

export const GET = withRole(["PRINCIPAL"], async () => {
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return Response.json(subjects);
});
