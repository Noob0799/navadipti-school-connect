import { db } from "@/lib/db";
import { listTeacherHomework, listTeacherTests } from "@/features/teacher/service";

export async function principalTeamOverview() {
  const [teachers, session, unassigned] = await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
    db.academicSession.findMany({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      select: { label: true, status: true },
    }),
    db.offeringSubject.count({
      where: { teacherAssignment: null, classOffering: { academicSession: { status: "ACTIVE" } } },
    }),
  ]);

  const teacherRows = await Promise.all(
    teachers.map(async (teacher) => {
      const [homework, tests] = await Promise.all([listTeacherHomework(teacher.id), listTeacherTests(teacher.id)]);
      const byClassSubject = new Map<string, { className: string; subject: string; homeworkToRemark: number; testsToGrade: number }>();
      const entryFor = (className: string, subject: string) => {
        const key = `${className}|${subject}`;
        const existing = byClassSubject.get(key) ?? { className, subject, homeworkToRemark: 0, testsToGrade: 0 };
        byClassSubject.set(key, existing);
        return existing;
      };
      for (const h of homework) entryFor(h.className, h.subject).homeworkToRemark += h.pendingRemarkCount;
      for (const t of tests) entryFor(t.className, t.subject).testsToGrade += t.ungradedCount;

      const rows = Array.from(byClassSubject.values()).sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject));
      return {
        id: teacher.id,
        name: teacher.name,
        active: teacher.status === "ACTIVE",
        homeworkToRemark: rows.reduce((n, r) => n + r.homeworkToRemark, 0),
        testsToGrade: rows.reduce((n, r) => n + r.testsToGrade, 0),
        rows,
      };
    }),
  );

  return {
    activeSession: session.find((s) => s.status === "ACTIVE")?.label ?? null,
    upcomingSession: session.find((s) => s.status === "UPCOMING")?.label ?? null,
    unassignedSubjects: unassigned,
    teachers: teacherRows,
  };
}
