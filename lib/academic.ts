import type { PrismaClient, SessionStatus, TermName } from "@prisma/client";

export const PRIMARY_SUBJECTS = ["English", "Bengali", "Mathematics", "Drawing", "General Knowledge"];
export const EXTENDED_SUBJECTS = [...PRIMARY_SUBJECTS, "Science", "History", "Geography"];

export const SCHOOL_CLASS_SUBJECTS: Record<string, string[]> = {
  Nursery: PRIMARY_SUBJECTS,
  Transition: PRIMARY_SUBJECTS,
  "Class 1": EXTENDED_SUBJECTS,
  "Class 2": EXTENDED_SUBJECTS,
  "Class 3": EXTENDED_SUBJECTS,
  "Class 4": EXTENDED_SUBJECTS,
  "Class 5": EXTENDED_SUBJECTS,
};

export const TERM_NAMES: TermName[] = ["CT1", "HALF_YEARLY", "CT2", "ANNUAL"];

export async function createSessionWithTemplate(
  db: PrismaClient,
  label: string,
  status: SessionStatus,
) {
  return db.$transaction(async (tx) => {
    const session = await tx.academicSession.create({ data: { label, status } });

    await tx.term.createMany({
      data: TERM_NAMES.map((name) => ({ academicSessionId: session.id, name })),
    });

    const schoolClasses = await tx.schoolClass.findMany();
    for (const schoolClass of schoolClasses) {
      const subjectNames = SCHOOL_CLASS_SUBJECTS[schoolClass.name] ?? [];
      const classOffering = await tx.classOffering.create({
        data: { schoolClassId: schoolClass.id, academicSessionId: session.id },
      });
      const subjects = await tx.subject.findMany({ where: { name: { in: subjectNames } } });
      await tx.offeringSubject.createMany({
        data: subjects.map((subject) => ({ classOfferingId: classOffering.id, subjectId: subject.id })),
      });
    }

    return session;
  });
}

export const TERM_SCALE: Record<TermName, { max: number; pass: number; label: string }> = {
  CT1: { max: 25, pass: 10, label: "Class Test 1" },
  HALF_YEARLY: { max: 50, pass: 20, label: "Half Yearly" },
  CT2: { max: 25, pass: 10, label: "Class Test 2" },
  ANNUAL: { max: 50, pass: 20, label: "Annual" },
};

export const SUBJECT_TOTAL_MAX = 150;
export const SUBJECT_TOTAL_PASS = 60;
