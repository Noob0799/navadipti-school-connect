import type { AttachmentOwnerType, NotificationType, TermName } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { TERM_NAMES, TERM_SCALE } from "@/lib/academic";
import { filesByOwner } from "@/features/attachments/lookup";
import type { GradeInput, HomeworkInput, HomeworkUpdate, TestInput } from "./schemas";

const ACTIVE_SESSION = { classOffering: { academicSession: { status: "ACTIVE" as const } } };

async function ownedOfferingSubject(teacherId: string, offeringSubjectId: string) {
  const row = await db.offeringSubject.findFirst({
    where: { id: offeringSubjectId, teacherAssignment: { teacherId }, ...ACTIVE_SESSION },
    select: {
      id: true,
      classOfferingId: true,
      subject: { select: { name: true } },
      classOffering: { select: { schoolClass: { select: { name: true } } } },
    },
  });
  if (!row) throw new HttpError(404, "This class is not one of your classes this session.");
  return {
    id: row.id,
    classOfferingId: row.classOfferingId,
    subjectName: row.subject.name,
    className: row.classOffering.schoolClass.name,
  };
}

const HOMEWORK_OWNED = (teacherId: string) => ({
  offeringSubject: { teacherAssignment: { teacherId }, ...ACTIVE_SESSION },
});

const TEST_OWNED = (teacherId: string) => ({
  offeringSubject: { teacherAssignment: { teacherId }, ...ACTIVE_SESSION },
});

const ACTIVE_ONLY = { offeringSubject: { ...ACTIVE_SESSION } };


async function ownedHomework(teacherId: string | null, id: string) {
  const row = await db.homework.findFirst({
    where: { id, ...(teacherId ? HOMEWORK_OWNED(teacherId) : ACTIVE_ONLY) },
    select: {
      id: true,
      title: true,
      description: true,
      deadlineDate: true,
      offeringSubject: {
        select: {
          id: true,
          classOfferingId: true,
          subject: { select: { name: true } },
          classOffering: { select: { schoolClass: { select: { name: true } } } },
        },
      },
    },
  });
  if (!row) throw new HttpError(404, "Homework not found.");
  return row;
}

async function ownedTest(teacherId: string | null, id: string) {
  const row = await db.test.findFirst({
    where: { id, ...(teacherId ? TEST_OWNED(teacherId) : ACTIVE_ONLY) },
    select: {
      id: true,
      title: true,
      deadlineDate: true,
      term: { select: { name: true } },
      offeringSubject: {
        select: {
          id: true,
          classOfferingId: true,
          subject: { select: { name: true } },
          classOffering: { select: { schoolClass: { select: { name: true } } } },
        },
      },
    },
  });
  if (!row) throw new HttpError(404, "Test not found.");
  return row;
}

async function notify(data: { type: NotificationType; message: string; createdById: string; classOfferingId?: string; userId?: string }) {
  await db.notification.create({ data });
}

export async function teacherAssignments(teacherId: string) {
  const rows = await db.offeringSubject.findMany({
    where: { teacherAssignment: { teacherId }, classOffering: { academicSession: { status: "ACTIVE" } } },
    orderBy: [{ classOffering: { schoolClass: { order: "asc" } } }, { subject: { name: "asc" } }],
    select: {
      id: true,
      subject: { select: { name: true } },
      classOffering: { select: { schoolClass: { select: { name: true } } } },
    },
  });
  return rows.map((row) => ({
    offeringSubjectId: row.id,
    subjectName: row.subject.name,
    className: row.classOffering.schoolClass.name,
  }));
}

export async function listTeacherHomework(teacherId: string | null) {
  const rows = await db.homework.findMany({
    where: teacherId ? HOMEWORK_OWNED(teacherId) : ACTIVE_ONLY,
    orderBy: { deadlineDate: "asc" },
    select: {
      id: true,
      title: true,
      deadlineDate: true,
      offeringSubject: {
        select: {
          subject: { select: { name: true } },
          classOffering: { select: { schoolClass: { select: { name: true } } } },
          teacherAssignment: { select: { teacher: { select: { name: true } } } },
        },
      },
      submissions: { select: { teacherRemark: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    teacherName: row.offeringSubject.teacherAssignment?.teacher.name ?? "",
    deadlineDate: row.deadlineDate,
    subject: row.offeringSubject.subject.name,
    className: row.offeringSubject.classOffering.schoolClass.name,
    submittedCount: row.submissions.length,
    pendingRemarkCount: row.submissions.filter((s) => s.teacherRemark === null).length,
  }));
}

export async function getTeacherHomework(teacherId: string | null, id: string) {
  return homeworkDetail(await ownedHomework(teacherId, id), id);
}

async function homeworkDetail(row: NonNullable<Awaited<ReturnType<typeof ownedHomework>>>, id: string) {
  const [materials, students, submissions] = await Promise.all([
    filesByOwner("HOMEWORK", [id]),
    db.enrollment.findMany({
      where: { classOfferingId: row.offeringSubject.classOfferingId, status: "ENROLLED" },
      orderBy: { student: { name: "asc" } },
      select: { student: { select: { id: true, name: true, studentProfile: { select: { schoolId: true } } } } },
    }),
    db.homeworkSubmission.findMany({
      where: { homeworkId: id },
      select: { id: true, studentId: true, submittedAt: true, teacherRemark: true },
    }),
  ]);
  const files = await filesByOwner("HOMEWORK_SUBMISSION", submissions.map((s) => s.id));
  const byStudent = new Map(submissions.map((s) => [s.studentId, s]));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    deadlineDate: row.deadlineDate,
    subject: row.offeringSubject.subject.name,
    className: row.offeringSubject.classOffering.schoolClass.name,
    offeringSubjectId: row.offeringSubject.id,
    materials: materials.get(id) ?? [],
    submissions: students.map(({ student }) => {
      const submission = byStudent.get(student.id) ?? null;
      return {
        studentId: student.id,
        name: student.name,
        schoolId: student.studentProfile?.schoolId ?? "",
        submissionId: submission?.id ?? null,
        submitted: submission !== null,
        submittedAt: submission?.submittedAt ?? null,
        late: submission ? submission.submittedAt > row.deadlineDate : false,
        remark: submission?.teacherRemark ?? "",
        files: submission ? files.get(submission.id) ?? [] : [],
      };
    }),
  };
}

export async function createHomework(teacherId: string, input: HomeworkInput) {
  const offering = await ownedOfferingSubject(teacherId, input.offeringSubjectId);
  const homework = await db.homework.create({
    data: {
      offeringSubjectId: offering.id,
      title: input.title,
      description: input.description,
      deadlineDate: input.deadlineDate,
      createdById: teacherId,
    },
    select: { id: true },
  });
  await notify({
    type: "HOMEWORK_CHANGED",
    message: `New homework: ${offering.className} ${offering.subjectName}, ${input.title}`,
    createdById: teacherId,
    classOfferingId: offering.classOfferingId,
  });
  return homework.id;
}

export async function updateHomework(teacherId: string, id: string, input: HomeworkUpdate) {
  const row = await ownedHomework(teacherId, id);
  await db.homework.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      deadlineDate: input.deadlineDate,
    },
  });
  await notify({
    type: "HOMEWORK_CHANGED",
    message: `Updated: ${row.offeringSubject.classOffering.schoolClass.name} ${row.offeringSubject.subject.name}, ${input.title ?? row.title}`,
    createdById: teacherId,
    classOfferingId: row.offeringSubject.classOfferingId,
  });
}

export async function setHomeworkRemark(teacherId: string, submissionId: string, remark: string) {
  const submission = await db.homeworkSubmission.findFirst({
    where: { id: submissionId, homework: HOMEWORK_OWNED(teacherId) },
    select: { id: true, studentId: true, homework: { select: { id: true, title: true } } },
  });
  if (!submission) throw new HttpError(404, "Submission not found.");

  await db.homeworkSubmission.update({
    where: { id: submissionId },
    data: { teacherRemark: remark || null },
  });
  if (remark) {
    await notify({
      type: "HOMEWORK_REMARK_ADDED",
      message: `Your teacher added a remark on ${submission.homework.title}`,
      createdById: teacherId,
      userId: submission.studentId,
    });
  }
}

export async function listTeacherTests(teacherId: string | null) {
  const rows = await db.test.findMany({
    where: teacherId ? TEST_OWNED(teacherId) : ACTIVE_ONLY,
    orderBy: { deadlineDate: "asc" },
    select: {
      id: true,
      title: true,
      deadlineDate: true,
      term: { select: { name: true } },
      offeringSubject: {
        select: {
          subject: { select: { name: true } },
          classOffering: { select: { schoolClass: { select: { name: true } } } },
          teacherAssignment: { select: { teacher: { select: { name: true } } } },
        },
      },
      submissions: { select: { marksObtained: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    teacherName: row.offeringSubject.teacherAssignment?.teacher.name ?? "",
    deadlineDate: row.deadlineDate,
    termName: row.term.name,
    termLabel: TERM_SCALE[row.term.name].label,
    max: TERM_SCALE[row.term.name].max,
    subject: row.offeringSubject.subject.name,
    className: row.offeringSubject.classOffering.schoolClass.name,
    answeredCount: row.submissions.length,
    ungradedCount: row.submissions.filter((s) => s.marksObtained === null).length,
  }));
}

export async function getTeacherTest(teacherId: string | null, id: string) {
  return testDetail(await ownedTest(teacherId, id), id);
}

async function testDetail(row: NonNullable<Awaited<ReturnType<typeof ownedTest>>>, id: string) {
  const termName = row.term.name;
  const scale = TERM_SCALE[termName];
  const [paper, students, submissions] = await Promise.all([
    filesByOwner("TEST", [id]),
    db.enrollment.findMany({
      where: { classOfferingId: row.offeringSubject.classOfferingId, status: "ENROLLED" },
      orderBy: { student: { name: "asc" } },
      select: { student: { select: { id: true, name: true, studentProfile: { select: { schoolId: true } } } } },
    }),
    db.testSubmission.findMany({
      where: { testId: id },
      select: { id: true, studentId: true, marksObtained: true, remark: true, submittedAt: true },
    }),
  ]);
  const files = await filesByOwner("TEST_SUBMISSION", submissions.map((s) => s.id));
  const byStudent = new Map(submissions.map((s) => [s.studentId, s]));

  return {
    id: row.id,
    title: row.title,
    deadlineDate: row.deadlineDate,
    termName,
    termLabel: scale.label,
    max: scale.max,
    pass: scale.pass,
    subject: row.offeringSubject.subject.name,
    className: row.offeringSubject.classOffering.schoolClass.name,
    paper: paper.get(id) ?? [],
    students: students.map(({ student }) => {
      const submission = byStudent.get(student.id) ?? null;
      return {
        studentId: student.id,
        name: student.name,
        schoolId: student.studentProfile?.schoolId ?? "",
        submissionId: submission?.id ?? null,
        answered: submission !== null,
        submittedAt: submission?.submittedAt ?? null,
        files: submission ? files.get(submission.id) ?? [] : [],
        marks: submission?.marksObtained ?? null,
        remark: submission?.remark ?? "",
      };
    }),
  };
}

export async function createOrUpdateTest(teacherId: string, offeringSubjectId: string, termName: TermName, input: TestInput) {
  const offering = await ownedOfferingSubject(teacherId, offeringSubjectId);
  const term = await db.term.findFirst({
    where: { name: termName, academicSession: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!term) throw new HttpError(404, "This term does not exist in the active session.");

  const existing = await db.test.findUnique({
    where: { offeringSubjectId_termId: { offeringSubjectId: offering.id, termId: term.id } },
    select: { id: true },
  });
  const test = await db.test.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId: offering.id, termId: term.id } },
    update: { title: input.title, deadlineDate: input.deadlineDate },
    create: { offeringSubjectId: offering.id, termId: term.id, title: input.title, deadlineDate: input.deadlineDate, createdById: teacherId },
    select: { id: true },
  });

  await notify({
    type: "TEST_CHANGED",
    message: `${existing ? "Updated" : "New"}: ${offering.className} ${offering.subjectName} ${TERM_SCALE[termName].label}, ${input.title}`,
    createdById: teacherId,
    classOfferingId: offering.classOfferingId,
  });
  return test.id;
}

export async function gradeSubmission(teacherId: string, submissionId: string, input: GradeInput) {
  const submission = await db.testSubmission.findFirst({
    where: { id: submissionId, test: TEST_OWNED(teacherId) },
    select: { id: true, test: { select: { term: { select: { name: true } } } } },
  });
  if (!submission) throw new HttpError(404, "Submission not found.");

  const max = TERM_SCALE[submission.test.term.name].max;
  if (input.marksObtained !== null && input.marksObtained > max) {
    throw new HttpError(400, `Marks cannot be more than ${max} for this test.`);
  }

  await db.testSubmission.update({
    where: { id: submissionId },
    data: {
      marksObtained: input.marksObtained,
      remark: input.remark || null,
      gradedById: input.marksObtained === null ? null : teacherId,
      gradedAt: input.marksObtained === null ? null : new Date(),
    },
  });
}

export async function releaseGrades(teacherId: string, testId: string) {
  const test = await ownedTest(teacherId, testId);
  const ungraded = await db.testSubmission.count({ where: { testId, marksObtained: null } });
  const scale = TERM_SCALE[test.term.name];
  await notify({
    type: "GRADES_RELEASED",
    message: `Grades released: ${test.offeringSubject.classOffering.schoolClass.name} ${test.offeringSubject.subject.name}, ${scale.label}`,
    createdById: teacherId,
    classOfferingId: test.offeringSubject.classOfferingId,
  });
  return { ungraded };
}

export async function upsertSyllabus(teacherId: string, offeringSubjectId: string, termName: TermName, content: string) {
  const offering = await ownedOfferingSubject(teacherId, offeringSubjectId);
  const term = await db.term.findFirst({
    where: { name: termName, academicSession: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!term) throw new HttpError(404, "This term does not exist in the active session.");

  const existing = await db.syllabus.findUnique({
    where: { offeringSubjectId_termId: { offeringSubjectId: offering.id, termId: term.id } },
    select: { id: true },
  });
  await db.syllabus.upsert({
    where: { offeringSubjectId_termId: { offeringSubjectId: offering.id, termId: term.id } },
    update: { content, publishedById: teacherId },
    create: { offeringSubjectId: offering.id, termId: term.id, content, publishedById: teacherId },
  });
  await notify({
    type: "SYLLABUS_CHANGED",
    message: `${existing ? "Updated" : "New"} syllabus: ${offering.className} ${offering.subjectName}, ${TERM_SCALE[termName].label}`,
    createdById: teacherId,
    classOfferingId: offering.classOfferingId,
  });
}

export async function listTeacherSyllabus(teacherId: string | null) {
  const offerings = await db.offeringSubject.findMany({
    where: { ...(teacherId ? { teacherAssignment: { teacherId } } : {}), classOffering: { academicSession: { status: "ACTIVE" } } },
    orderBy: [{ classOffering: { schoolClass: { order: "asc" } } }, { subject: { name: "asc" } }],
    select: {
      id: true,
      subject: { select: { name: true } },
      classOffering: { select: { schoolClass: { select: { name: true } } } },
      syllabi: { select: { id: true, content: true, updatedAt: true, term: { select: { name: true } } } },
    },
  });
  const files = await filesByOwner("SYLLABUS", offerings.flatMap((o) => o.syllabi.map((s) => s.id)));

  return offerings.map((offering) => ({
    offeringSubjectId: offering.id,
    subject: offering.subject.name,
    className: offering.classOffering.schoolClass.name,
    terms: TERM_NAMES.map((termName) => {
      const syllabus = offering.syllabi.find((s) => s.term.name === termName) ?? null;
      return {
        termName,
        termLabel: TERM_SCALE[termName].label,
        syllabusId: syllabus?.id ?? null,
        content: syllabus?.content ?? "",
        updatedAt: syllabus?.updatedAt ?? null,
        files: syllabus ? files.get(syllabus.id) ?? [] : [],
        exists: syllabus !== null,
      };
    }),
  }));
}

export async function teacherOwnsOwner(teacherId: string, ownerType: AttachmentOwnerType, ownerId: string) {
  if (ownerType === "HOMEWORK") return (await db.homework.findFirst({ where: { id: ownerId, ...HOMEWORK_OWNED(teacherId) }, select: { id: true } })) !== null;
  if (ownerType === "TEST") return (await db.test.findFirst({ where: { id: ownerId, ...TEST_OWNED(teacherId) }, select: { id: true } })) !== null;
  if (ownerType === "SYLLABUS") {
    return (await db.syllabus.findFirst({ where: { id: ownerId, offeringSubject: { teacherAssignment: { teacherId }, ...ACTIVE_SESSION } }, select: { id: true } })) !== null;
  }
  if (ownerType === "HOMEWORK_SUBMISSION") {
    return (await db.homeworkSubmission.findFirst({ where: { id: ownerId, homework: HOMEWORK_OWNED(teacherId) }, select: { id: true } })) !== null;
  }
  if (ownerType === "TEST_SUBMISSION") {
    return (await db.testSubmission.findFirst({ where: { id: ownerId, test: TEST_OWNED(teacherId) }, select: { id: true } })) !== null;
  }
  return false;
}

export async function listTeacherPending(teacherId: string) {
  const [homework, tests] = await Promise.all([listTeacherHomework(teacherId), listTeacherTests(teacherId)]);
  return {
    homework: homework.filter((h) => h.pendingRemarkCount > 0).map((h) => ({
      id: h.id,
      title: h.title,
      subject: h.subject,
      className: h.className,
      pending: h.pendingRemarkCount,
    })),
    tests: tests.filter((t) => t.ungradedCount > 0).map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      className: t.className,
      termLabel: t.termLabel,
      pending: t.ungradedCount,
    })),
  };
}
