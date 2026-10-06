import { RoleArea } from "@/components/role-area";

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return <RoleArea role="STUDENT">{children}</RoleArea>;
}
