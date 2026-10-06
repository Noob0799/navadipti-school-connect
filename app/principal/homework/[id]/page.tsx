import { TeacherHomeworkDetail } from "@/features/teacher/components/homework";

export default async function PrincipalHomeworkDetailPage({ params }: PageProps<"/principal/homework/[id]">) {
  const { id } = await params;
  return <TeacherHomeworkDetail id={id} readOnly />;
}
