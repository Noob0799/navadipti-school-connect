import { TeacherTestDetail } from "@/features/teacher/components/tests";

export default async function PrincipalTestDetailPage({ params }: PageProps<"/principal/tests/[id]">) {
  const { id } = await params;
  return <TeacherTestDetail id={id} readOnly />;
}
