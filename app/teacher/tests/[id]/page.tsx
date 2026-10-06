import { TeacherTestDetail } from "@/features/teacher/components/tests";

export default async function TeacherTestDetailPage({ params }: PageProps<"/teacher/tests/[id]">) {
  const { id } = await params;
  return <TeacherTestDetail id={id} />;
}
