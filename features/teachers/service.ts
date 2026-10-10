import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import type { ExpertiseInput, TeacherInput, TeacherUpdate } from "./schemas";

const teacherSelect = {
  id: true,
  name: true,
  phoneNumber: true,
  status: true,
  teacherProfile: { select: { employeeInfo: true } },
  teacherSubjectExpertise: {
    select: { subject: { select: { id: true, name: true } } },
    orderBy: { subject: { name: "asc" } },
  },
} as const;

type TeacherRow = {
  id: string;
  name: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE";
  teacherProfile: { employeeInfo: string | null } | null;
  teacherSubjectExpertise: { subject: { id: string; name: string } }[];
};

function toTeacher(row: TeacherRow) {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phoneNumber,
    status: row.status,
    employeeInfo: row.teacherProfile?.employeeInfo ?? "",
    subjects: row.teacherSubjectExpertise.map((e) => e.subject),
  };
}

async function findTeacherRow(id: string) {
  const row = await db.user.findFirst({
    where: { id, role: "TEACHER" },
    select: teacherSelect,
  });
  if (!row) throw new HttpError(404, "Teacher not found.");
  return row;
}

async function ensurePhoneAvailable(phoneNumber: string, exceptUserId?: string) {
  const existing = await db.user.findUnique({ where: { phoneNumber }, select: { id: true } });
  if (existing && existing.id !== exceptUserId) {
    throw new HttpError(409, "Another account already uses this phone number.");
  }
}

export async function listTeachers() {
  const rows = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    select: teacherSelect,
  });
  return rows.map(toTeacher);
}

export async function getTeacher(id: string) {
  const row = await findTeacherRow(id);
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId: id },
    orderBy: [
      { offeringSubject: { classOffering: { schoolClass: { order: "asc" } } } },
      { offeringSubject: { subject: { name: "asc" } } },
    ],
    select: {
      offeringSubject: {
        select: {
          id: true,
          subject: { select: { name: true } },
          classOffering: {
            select: {
              schoolClass: { select: { name: true, order: true } },
              academicSession: { select: { label: true, status: true } },
            },
          },
        },
      },
    },
  });

  return {
    ...toTeacher(row),
    assignments: assignments.map(({ offeringSubject }) => ({
      offeringSubjectId: offeringSubject.id,
      subjectName: offeringSubject.subject.name,
      className: offeringSubject.classOffering.schoolClass.name,
      classOrder: offeringSubject.classOffering.schoolClass.order,
      sessionLabel: offeringSubject.classOffering.academicSession.label,
      sessionStatus: offeringSubject.classOffering.academicSession.status,
    })),
  };
}

export async function createTeacher(input: TeacherInput) {
  await ensurePhoneAvailable(input.phoneNumber);

  const temporaryPassword = randomBytes(9).toString("base64url");
  const row = await db.user.create({
    data: {
      name: input.name,
      phoneNumber: input.phoneNumber,
      passwordHash: await bcrypt.hash(temporaryPassword, 10),
      role: "TEACHER",
      teacherProfile: { create: { employeeInfo: input.employeeInfo || null } },
    },
    select: { id: true },
  });

  return { teacher: await getTeacher(row.id), temporaryPassword };
}

export async function updateTeacher(id: string, input: TeacherUpdate) {
  await findTeacherRow(id);
  if (input.phoneNumber) await ensurePhoneAvailable(input.phoneNumber, id);

  await db.user.update({
    where: { id },
    data: {
      name: input.name,
      phoneNumber: input.phoneNumber,
      teacherProfile: input.employeeInfo === undefined
        ? undefined
        : {
            upsert: {
              create: { employeeInfo: input.employeeInfo || null },
              update: { employeeInfo: input.employeeInfo || null },
            },
          },
    },
  });

  return getTeacher(id);
}

export async function setTeacherStatus(id: string, active: boolean) {
  await findTeacherRow(id);
  await db.user.update({ where: { id }, data: { status: active ? "ACTIVE" : "INACTIVE" } });
  return getTeacher(id);
}

export async function setExpertise(id: string, input: ExpertiseInput) {
  await findTeacherRow(id);

  const subjectIds = [...new Set(input.subjectIds)];
  const subjectCount = await db.subject.count({ where: { id: { in: subjectIds } } });
  if (subjectCount !== subjectIds.length) throw new HttpError(400, "One or more subjects do not exist.");

  const current = await db.teacherSubjectExpertise.findMany({
    where: { teacherId: id },
    select: { subjectId: true },
  });
  const removed = current.map((c) => c.subjectId).filter((s) => !subjectIds.includes(s));

  if (removed.length > 0) {
    const blocking = await db.teacherAssignment.findMany({
      where: {
        teacherId: id,
        offeringSubject: { subjectId: { in: removed }, classOffering: { academicSession: { status: "ACTIVE" } } },
      },
      select: {
        offeringSubject: {
          select: {
            subject: { select: { name: true } },
            classOffering: { select: { schoolClass: { select: { name: true } } } },
          },
        },
      },
    });
    if (blocking.length > 0) {
      const list = blocking
        .map((b) => `${b.offeringSubject.subject.name} (${b.offeringSubject.classOffering.schoolClass.name})`)
        .join(", ");
      throw new HttpError(409, `Reassign these classes first: ${list}.`);
    }
  }

  await db.$transaction([
    db.teacherSubjectExpertise.deleteMany({ where: { teacherId: id } }),
    db.teacherSubjectExpertise.createMany({
      data: subjectIds.map((subjectId) => ({ teacherId: id, subjectId })),
    }),
  ]);

  return getTeacher(id);
}

export async function listClassOfferings() {
  const session = await db.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { id: true, label: true } });
  if (!session) return { session: null, classes: [] };

  const offerings = await db.classOffering.findMany({
    where: { academicSessionId: session.id },
    orderBy: { schoolClass: { order: "asc" } },
    select: {
      id: true,
      schoolClass: { select: { name: true } },
      offeringSubjects: {
        orderBy: { subject: { name: "asc" } },
        select: {
          id: true,
          subject: { select: { id: true, name: true } },
          teacherAssignment: { select: { teacher: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return {
    session,
    classes: offerings.map((o) => ({
      id: o.id,
      name: o.schoolClass.name,
      subjects: o.offeringSubjects.map((os) => ({
        offeringSubjectId: os.id,
        subjectId: os.subject.id,
        subjectName: os.subject.name,
        teacher: os.teacherAssignment?.teacher ?? null,
      })),
    })),
  };
}

export async function assignTeacher(offeringSubjectId: string, teacherId: string) {
  const offeringSubject = await db.offeringSubject.findUnique({
    where: { id: offeringSubjectId },
    select: {
      subjectId: true,
      subject: { select: { name: true } },
      classOffering: {
        select: {
          schoolClass: { select: { name: true } },
          academicSession: { select: { status: true } },
        },
      },
    },
  });
  if (!offeringSubject) throw new HttpError(404, "Class subject not found.");
  if (offeringSubject.classOffering.academicSession.status !== "ACTIVE") {
    throw new HttpError(409, "Teachers can only be assigned in the active session.");
  }

  const teacher = await db.user.findFirst({ where: { id: teacherId, role: "TEACHER" }, select: { status: true } });
  if (!teacher) throw new HttpError(404, "Teacher not found.");
  if (teacher.status !== "ACTIVE") throw new HttpError(409, "This teacher is inactive.");

  const expert = await db.teacherSubjectExpertise.findUnique({
    where: { teacherId_subjectId: { teacherId, subjectId: offeringSubject.subjectId } },
    select: { teacherId: true },
  });
  if (!expert) {
    throw new HttpError(409, `This teacher is not an expert in ${offeringSubject.subject.name}.`);
  }

  await db.teacherAssignment.upsert({
    where: { offeringSubjectId },
    update: { teacherId },
    create: { offeringSubjectId, teacherId },
  });
}

export async function unassignTeacher(offeringSubjectId: string) {
  await db.teacherAssignment.deleteMany({ where: { offeringSubjectId } });
}
