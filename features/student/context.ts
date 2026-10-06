import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";

export type CurrentClass = {
  classOfferingId: string;
  className: string;
  academicSessionId: string;
  sessionLabel: string;
};

export async function findCurrentClass(studentId: string): Promise<CurrentClass | null> {
  const enrollment = await db.enrollment.findFirst({
    where: {
      studentId,
      status: "ENROLLED",
      classOffering: { academicSession: { status: "ACTIVE" } },
    },
    select: {
      classOfferingId: true,
      classOffering: {
        select: {
          academicSessionId: true,
          schoolClass: { select: { name: true } },
          academicSession: { select: { label: true } },
        },
      },
    },
  });
  if (!enrollment) return null;
  return {
    classOfferingId: enrollment.classOfferingId,
    className: enrollment.classOffering.schoolClass.name,
    academicSessionId: enrollment.classOffering.academicSessionId,
    sessionLabel: enrollment.classOffering.academicSession.label,
  };
}

export async function requireCurrentClass(studentId: string) {
  const current = await findCurrentClass(studentId);
  if (!current) throw new HttpError(404, "You are not enrolled in an active class yet.");
  return current;
}
