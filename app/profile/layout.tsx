import { redirect } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { getSession } from "@/lib/session";

export default async function ProfileLayout({ children }: LayoutProps<"/profile">) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <RoleArea role={session.role}>{children}</RoleArea>;
}
