import { RoleArea } from "@/components/role-area";

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return <RoleArea role="TEACHER">{children}</RoleArea>;
}
