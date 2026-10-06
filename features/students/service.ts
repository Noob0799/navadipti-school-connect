import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { enrollStudentSchema, updateStudentSchema } from "./schemas";

type EnrollInput = z.infer<typeof enrollStudentSchema>;
type UpdateInput = z.infer<typeof updateStudentSchema>;

async function activeSessionLabel() {
  const session = await db.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { label: true } });
  if (!session) throw new HttpError(409, "There is no active session.");
  return session.label;
}

async function ensurePhoneAvailable(phoneNumber: string, exceptUserId?: string) {
  const existing = await db.user.findUnique({ where: { phoneNumber }, select: { id: true } });
  if (existing && existing.id !== exceptUserId) {
    throw new HttpError(409, "Another account already uses this phone number.");
  }
}

export async function listStudents() {
  const label = await db.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      status: true,
      studentProfile: { select: { schoolId: true } },
      enrollments: {
        where: label ? { classOffering: { academicSessionId: label.id } } : { id: "none" },
        select: {
          id: true,
          status: true,
          classOffering: { select: { schoolClass: { select: { name: true } } } },
        },
      },
    },
  });

  return students.map((s) => {
    const current = s.enrollments.find((e) => e.status === "ENROLLED") ?? s.enrollments[0] ?? null;
    return {
      id: s.id,
      name: s.name,
      phoneNumber: s.phoneNumber,
      schoolId: s.studentProfile?.schoolId ?? "",
      status: s.status,
      enrollmentId: current?.id ?? null,
      className: current?.classOffering.schoolClass.name ?? null,
      enrollmentStatus: current?.status ?? null,
    };
  });
}

export async function getStudent(id: string) {
  const student = await db.user.findFirst({
    where: { id, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      status: true,
      studentProfile: { select: { schoolId: true } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
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
  if (!student) throw new HttpError(404, "Student not found.");

  return {
    id: student.id,
    name: student.name,
    phoneNumber: student.phoneNumber,
    status: student.status,
    schoolId: student.studentProfile?.schoolId ?? "",
    enrollments: student.enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      className: e.classOffering.schoolClass.name,
      sessionLabel: e.classOffering.academicSession.label,
      sessionStatus: e.classOffering.academicSession.status,
    })),
  };
}

export async function enrollStudent(input: EnrollInput) {
  const sessionLabel = await activeSessionLabel();
  const offering = await db.classOffering.findFirst({
    where: { id: input.classOfferingId, academicSession: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!offering) throw new HttpError(400, "Choose a class in the active session.");

  await ensurePhoneAvailable(input.phoneNumber);
  if (input.schoolId) {
    const taken = await db.studentProfile.findUnique({ where: { schoolId: input.schoolId }, select: { userId: true } });
    if (taken) throw new HttpError(409, "Another student already has this school ID.");
  }

  const temporaryPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const year = Number(sessionLabel.slice(0, 4));

  const result = await db.$transaction(async (tx) => {
    const schoolId = input.schoolId || (await nextSchoolId(tx, year));
    const user = await tx.user.create({
      data: {
        name: input.name,
        phoneNumber: input.phoneNumber,
        passwordHash,
        role: "STUDENT",
        studentProfile: { create: { schoolId } },
      },
      select: { id: true },
    });
    await tx.enrollment.create({
      data: { studentId: user.id, classOfferingId: input.classOfferingId, status: "ENROLLED" },
    });
    return { studentId: user.id, schoolId };
  });

  return { ...result, temporaryPassword };
}

async function nextSchoolId(tx: Prisma.TransactionClient, year: number) {
  for (;;) {
    const rows = await tx.$queryRaw<{ lastSequence: number }[]>`
      INSERT INTO "SchoolIdCounter" ("year", "lastSequence") VALUES (${year}, 1)
      ON CONFLICT ("year") DO UPDATE SET "lastSequence" = "SchoolIdCounter"."lastSequence" + 1
      RETURNING "lastSequence"`;
    const candidate = `ND-${year}-${String(rows[0].lastSequence).padStart(4, "0")}`;
    const taken = await tx.studentProfile.findUnique({ where: { schoolId: candidate }, select: { userId: true } });
    if (!taken) return candidate;
  }
}

export async function updateStudent(id: string, input: UpdateInput) {
  const existing = await db.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Student not found.");
  if (input.phoneNumber) await ensurePhoneAvailable(input.phoneNumber, id);

  await db.user.update({ where: { id }, data: { name: input.name, phoneNumber: input.phoneNumber } });
  return getStudent(id);
}

export async function withdrawEnrollment(enrollmentId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, status: true, studentId: true },
  });
  if (!enrollment) throw new HttpError(404, "Enrollment not found.");
  if (enrollment.status !== "ENROLLED") throw new HttpError(409, "Only a current enrollment can be withdrawn.");

  await db.$transaction([
    db.enrollment.update({ where: { id: enrollmentId }, data: { status: "WITHDRAWN" } }),
    db.user.update({ where: { id: enrollment.studentId }, data: { status: "INACTIVE" } }),
  ]);
  return enrollment.studentId;
}
