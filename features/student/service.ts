import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import type { TermName } from "@prisma/client";
import { SUBJECT_TOTAL_MAX, SUBJECT_TOTAL_PASS, TERM_NAMES, TERM_SCALE } from "@/lib/academic";
import { filesByOwner, type FileRef } from "@/features/attachments/lookup";
import { requireCurrentClass } from "./context";

export async function listHomework(studentId: string) {
  const current = await requireCurrentClass(studentId);
  const rows = await db.homework.findMany({
    where: { offeringSubject: { classOfferingId: current.classOfferingId } },
    orderBy: { deadlineDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      deadlineDate: true,
      offeringSubject: { select: { subject: { select: { name: true } } } },
      submissions: {
        where: { studentId },
        select: { id: true, submittedAt: true, teacherRemark: true },
      },
    },
  });

  const materials = await filesByOwner("HOMEWORK", rows.map((r) => r.id));
  const mine = await filesByOwner("HOMEWORK_SUBMISSION", rows.flatMap((r) => r.submissions.map((s) => s.id)));

  return rows.map((row) => {
    const submission = row.submissions[0] ?? null;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      subject: row.offeringSubject.subject.name,
      deadlineDate: row.deadlineDate,
      materials: materials.get(row.id) ?? [],
      submission: submission
        ? {
            id: submission.id,
            submittedAt: submission.submittedAt,
            late: submission.submittedAt > row.deadlineDate,
            remark: submission.teacherRemark,
            files: mine.get(submission.id) ?? [],
          }
        : null,
    };
  });
}

export async function getHomework(homeworkId: string, studentId: string) {
  const all = await listHomework(studentId);
  const item = all.find((h) => h.id === homeworkId);
  if (!item) throw new HttpError(404, "Homework not found in your class.");
  return item;
}

export async function submitHomework(homeworkId: string, studentId: string) {
  await getHomework(homeworkId, studentId);
  const submission = await db.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId } },
    update: { submittedAt: new Date() },
    create: { homeworkId, studentId },
    select: { id: true },
  });
  return { submissionId: submission.id, homework: await getHomework(homeworkId, studentId) };
}

export async function listTests(studentId: string) {
  const current = await requireCurrentClass(studentId);
  const rows = await db.test.findMany({
    where: { offeringSubject: { classOfferingId: current.classOfferingId } },
    orderBy: { deadlineDate: "asc" },
    select: {
      id: true,
      title: true,
      deadlineDate: true,
      term: { select: { name: true } },
      offeringSubject: { select: { subject: { select: { name: true } } } },
      submissions: {
        where: { studentId },
        select: { id: true, submittedAt: true, marksObtained: true, remark: true, gradedAt: true },
      },
    },
  });

  const papers = await filesByOwner("TEST", rows.map((r) => r.id));
  const mine = await filesByOwner("TEST_SUBMISSION", rows.flatMap((r) => r.submissions.map((s) => s.id)));

  return rows.map((row) => {
    const scale = TERM_SCALE[row.term.name];
    const submission = row.submissions[0] ?? null;
    return {
      id: row.id,
      title: row.title,
      subject: row.offeringSubject.subject.name,
      termName: row.term.name,
      termLabel: scale.label,
      deadlineDate: row.deadlineDate,
      max: scale.max,
      pass: scale.pass,
      paper: papers.get(row.id) ?? [],
      submission: submission
        ? {
            id: submission.id,
            submittedAt: submission.submittedAt,
            files: mine.get(submission.id) ?? [],
            marks: submission.marksObtained,
            remark: submission.remark,
            graded: submission.gradedAt !== null,
          }
        : null,
    };
  });
}

export async function getTest(testId: string, studentId: string) {
  const all = await listTests(studentId);
  const item = all.find((t) => t.id === testId);
  if (!item) throw new HttpError(404, "Test not found in your class.");
  return item;
}

export async function submitTest(testId: string, studentId: string) {
  await getTest(testId, studentId);
  const submission = await db.testSubmission.upsert({
    where: { testId_studentId: { testId, studentId } },
    update: { submittedAt: new Date() },
    create: { testId, studentId },
    select: { id: true },
  });
  return { submissionId: submission.id, test: await getTest(testId, studentId) };
}

export async function listSyllabus(studentId: string) {
  const current = await requireCurrentClass(studentId);
  const rows = await db.syllabus.findMany({
    where: { offeringSubject: { classOfferingId: current.classOfferingId } },
    select: {
      id: true,
      content: true,
      updatedAt: true,
      term: { select: { name: true } },
      offeringSubject: { select: { subject: { select: { name: true } } } },
    },
  });
  const files = await filesByOwner("SYLLABUS", rows.map((r) => r.id));

  type SyllabusCell = { content: string; updatedAt: Date; files: FileRef[] };
  const subjects = new Map<string, Record<string, SyllabusCell>>();
  for (const row of rows) {
    const bySubject = subjects.get(row.offeringSubject.subject.name) ?? {};
    bySubject[row.term.name] = { content: row.content, updatedAt: row.updatedAt, files: files.get(row.id) ?? [] };
    subjects.set(row.offeringSubject.subject.name, bySubject);
  }

  return Array.from(subjects.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subject, byTerm]) => ({
      subject,
      terms: TERM_NAMES.map((name) => ({
        termName: name,
        termLabel: TERM_SCALE[name].label,
        syllabus: byTerm[name] ?? null,
      })),
    }));
}

export async function listResults(studentId: string) {
  const current = await requireCurrentClass(studentId);
  const tests = await db.test.findMany({
    where: { offeringSubject: { classOfferingId: current.classOfferingId } },
    select: {
      id: true,
      term: { select: { name: true } },
      offeringSubject: { select: { id: true, subject: { select: { name: true } } } },
      submissions: {
        where: { studentId },
        select: { marksObtained: true, remark: true },
      },
    },
  });

  type ResultTest = { testId: string; termName: TermName; termLabel: string; marks: number | null; max: number; pass: number; remark: string | null };
  const bySubject = new Map<string, { subject: string; total: number; allGraded: boolean; tests: ResultTest[] }>();
  for (const test of tests) {
    const scale = TERM_SCALE[test.term.name];
    const submission = test.submissions[0] ?? null;
    const marks = submission?.marksObtained ?? null;
    const entry = bySubject.get(test.offeringSubject.id) ?? {
      subject: test.offeringSubject.subject.name,
      total: 0,
      allGraded: true,
      tests: [],
    };
    entry.total += marks ?? 0;
    entry.tests.push({
      testId: test.id,
      termLabel: scale.label,
      termName: test.term.name,
      marks,
      max: scale.max,
      pass: scale.pass,
      remark: submission?.remark ?? null,
    });
    bySubject.set(test.offeringSubject.id, entry);
  }

  return Array.from(bySubject.values())
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .map((entry) => {
      const allGraded = TERM_NAMES.every((name) => entry.tests.some((t) => t.termName === name && t.marks !== null));
      return {
        ...entry,
        allGraded,
        totalMax: SUBJECT_TOTAL_MAX,
        totalPass: SUBJECT_TOTAL_PASS,
        passed: allGraded && entry.total >= SUBJECT_TOTAL_PASS,
        tests: [...entry.tests].sort((a, b) => TERM_NAMES.indexOf(a.termName) - TERM_NAMES.indexOf(b.termName)),
      };
    });
}

export async function listNotifications(userId: string) {
  const current = await requireCurrentClass(userId).catch(() => null);
  const cursor = await db.notificationCursor.findUnique({ where: { userId }, select: { lastReadAt: true } });

  const audience: object[] = [{ userId }, { userId: null, classOfferingId: null }];
  if (current) audience.push({ classOfferingId: current.classOfferingId });

  const rows = await db.notification.findMany({
    where: { OR: audience },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, type: true, message: true, createdAt: true },
  });

  const lastRead = cursor?.lastReadAt ?? null;
  const items = rows.map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    createdAt: row.createdAt,
    isNew: lastRead === null || row.createdAt > lastRead,
  }));

  return { unreadCount: items.filter((i) => i.isNew).length, items };
}

export async function markNotificationsRead(userId: string) {
  const now = new Date();
  await db.notificationCursor.upsert({
    where: { userId },
    update: { lastReadAt: now },
    create: { userId, lastReadAt: now },
  });
  return now;
}

export async function pendingForStudent(studentId: string) {
  const [homework, tests] = await Promise.all([listHomework(studentId), listTests(studentId)]);
  return {
    homework: homework.filter((h) => h.submission === null).map((h) => ({ id: h.id, title: h.title, subject: h.subject, deadlineDate: h.deadlineDate })),
    tests: tests.filter((t) => t.submission === null).map((t) => ({ id: t.id, title: t.title, subject: t.subject, termLabel: t.termLabel, deadlineDate: t.deadlineDate, max: t.max })),
  };
}

