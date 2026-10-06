import { TestDetail } from "@/features/student/components/tests";

export default async function StudentTestDetailPage({ params }: PageProps<"/student/tests/[id]">) {
  const { id } = await params;
  return <TestDetail id={id} />;
}
