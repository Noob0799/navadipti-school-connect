import { StudentDetail } from "@/features/students/components/students";

export default async function PrincipalStudentPage({ params }: PageProps<"/principal/students/[id]">) {
  const { id } = await params;
  return <StudentDetail id={id} />;
}
