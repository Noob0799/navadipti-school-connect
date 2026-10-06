import { HomeworkDetail } from "@/features/student/components/homework";

export default async function StudentHomeworkDetailPage({ params }: PageProps<"/student/homework/[id]">) {
  const { id } = await params;
  return <HomeworkDetail id={id} />;
}
