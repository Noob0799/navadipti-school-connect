import { RoleArea } from "@/components/role-area";

export default function PrincipalLayout({ children }: LayoutProps<"/principal">) {
  return <RoleArea role="PRINCIPAL">{children}</RoleArea>;
}
