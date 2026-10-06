import { TeacherHomeworkDetail } from "@/features/teacher/components/homework";

export default async function TeacherHomeworkDetailPage({ params }: PageProps<"/teacher/homework/[id]">) {
  const { id } = await params;
  return <TeacherHomeworkDetail id={id} />;
}
