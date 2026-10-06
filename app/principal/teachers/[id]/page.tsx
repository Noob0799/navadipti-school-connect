import { TeacherDetail } from "@/features/teachers/components/teacher-detail";

export default async function TeacherPage({ params }: PageProps<"/principal/teachers/[id]">) {
  const { id } = await params;
  return <TeacherDetail id={id} />;
}
