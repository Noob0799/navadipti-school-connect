import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { SUBJECT_TOTAL_MAX, SUBJECT_TOTAL_PASS, TERM_NAMES } from "@/lib/academic";
import type { TermName } from "@prisma/client";

async function sourceOffering(classOfferingId: string) {
  const offering = await db.classOffering.findUnique({
    where: { id: classOfferingId },
    select: {
      id: true,
      schoolClassId: true,
      schoolClass: { select: { name: true, order: true } },
      academicSession: { select: { id: true, label: true, status: true } },
    },
  });
  if (!offering) throw new HttpError(404, "Class not found.");
  if (offering.academicSession.status !== "ACTIVE") {
    throw new HttpError(409, "Promotion starts from the active session's classes.");
  }
  return offering;
}

async function upcomingSession() {
  return db.academicSession.findFirst({ where: { status: "UPCOMING" }, select: { id: true, label: true } });
}

async function maxClassOrder() {
  const top = await db.schoolClass.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  return top?.order ?? 0;
}

export async function promotionReview(classOfferingId: string) {
  const offering = await sourceOffering(classOfferingId);
  const next = await upcomingSession();
  const [subjects, enrollments, submissions] = await Promise.all([
    db.offeringSubject.findMany({
      where: { classOfferingId },
      orderBy: { subject: { name: "asc" } },
      select: { id: true, subject: { select: { name: true } } },
    }),
    db.enrollment.findMany({
      where: { classOfferingId, status: "ENROLLED" },
      orderBy: { student: { name: "asc" } },
      select: { student: { select: { id: true, name: true, studentProfile: { select: { schoolId: true } } } } },
    }),
    db.testSubmission.findMany({
      where: { test: { offeringSubject: { classOfferingId } } },
      select: {
        studentId: true,
        marksObtained: true,
        test: { select: { term: { select: { name: true } }, offeringSubjectId: true } },
      },
    }),
  ]);

  const marks = new Map<string, number | null>();
  for (const s of submissions) {
    marks.set(`${s.studentId}|${s.test.offeringSubjectId}|${s.test.term.name}`, s.marksObtained);
  }

  return {
    classOfferingId,
    className: offering.schoolClass.name,
    sessionLabel: offering.academicSession.label,
    upcomingSessionLabel: next?.label ?? null,
    isFinalClass: offering.schoolClass.order === (await maxClassOrder()),
    subjects: subjects.map((s) => ({ offeringSubjectId: s.id, name: s.subject.name })),
    students: enrollments.map(({ student }) => ({
      id: student.id,
      name: student.name,
      schoolId: student.studentProfile?.schoolId ?? "",
      subjects: subjects.map((subject) => {
        const terms = TERM_NAMES.map((termName: TermName) => {
          const value = marks.get(`${student.id}|${subject.id}|${termName}`);
          return { termName, marks: value ?? null };
        });
        const total = terms.reduce((sum, t) => sum + (t.marks ?? 0), 0);
        const allGraded = terms.every((t) => t.marks !== null);
        return {
          offeringSubjectId: subject.id,
          name: subject.subject.name,
          terms,
          total,
          allGraded,
          passed: allGraded && total >= SUBJECT_TOTAL_PASS,
        };
      }),
    })),
    totals: { max: SUBJECT_TOTAL_MAX, pass: SUBJECT_TOTAL_PASS },
  };
}

export async function promoteClass(classOfferingId: string, promotedStudentIds: string[]) {
  const offering = await sourceOffering(classOfferingId);
  const next = await upcomingSession();
  if (!next) throw new HttpError(409, "Create the next session before promoting students.");

  const finalClass = offering.schoolClass.order === (await maxClassOrder());
  const nextSchoolClass = finalClass
    ? null
    : await db.schoolClass.findFirst({ where: { order: offering.schoolClass.order + 1 }, select: { id: true } });
  if (!finalClass && !nextSchoolClass) throw new HttpError(409, "The next class is not set up.");

  const targetOffering = nextSchoolClass
    ? await db.classOffering.findFirst({
        where: { academicSessionId: next.id, schoolClassId: nextSchoolClass.id },
        select: { id: true },
      })
    : null;
  const retainOffering = await db.classOffering.findFirst({
    where: { academicSessionId: next.id, schoolClassId: offering.schoolClassId },
    select: { id: true },
  });
  if (!retainOffering) throw new HttpError(409, `${offering.schoolClass.name} is not set up in ${next.label}.`);
  if (!finalClass && !targetOffering) throw new HttpError(409, `The next class is not set up in ${next.label}.`);

  const enrolled = await db.enrollment.findMany({
    where: { classOfferingId, status: "ENROLLED" },
    select: { id: true, studentId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.studentId));
  const unknown = promotedStudentIds.filter((id) => !enrolledIds.has(id));
  if (unknown.length > 0) throw new HttpError(400, "Some selected students are not in this class any more.");

  const promoted = new Set(promotedStudentIds);
  let promotedCount = 0;
  let retainedCount = 0;
  let graduatedCount = 0;

  await db.$transaction(async (tx) => {
    for (const enrollment of enrolled) {
      if (promoted.has(enrollment.studentId)) {
        if (finalClass) {
          await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "GRADUATED" } });
          await tx.user.update({ where: { id: enrollment.studentId }, data: { status: "INACTIVE" } });
          graduatedCount++;
        } else {
          await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "PROMOTED" } });
          await tx.enrollment.upsert({
            where: { studentId_classOfferingId: { studentId: enrollment.studentId, classOfferingId: targetOffering!.id } },
            update: {},
            create: { studentId: enrollment.studentId, classOfferingId: targetOffering!.id, status: "ENROLLED" },
          });
          promotedCount++;
        }
      } else {
        await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "RETAINED" } });
        await tx.enrollment.upsert({
          where: { studentId_classOfferingId: { studentId: enrollment.studentId, classOfferingId: retainOffering.id } },
          update: {},
          create: { studentId: enrollment.studentId, classOfferingId: retainOffering.id, status: "ENROLLED" },
        });
        retainedCount++;
      }
    }
  });

  return { promoted: promotedCount, retained: retainedCount, graduated: graduatedCount, into: next.label };
}
