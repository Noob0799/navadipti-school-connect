import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { createSessionWithTemplate } from "@/lib/academic";

export function labelAfter(label: string) {
  const start = Number(label.slice(0, 4)) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export async function listSessions() {
  const sessions = await db.academicSession.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true, status: true },
  });
  return {
    sessions,
    suggestedNextLabel: labelAfter(sessions.at(-1)?.label ?? `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`),
  };
}

export async function createNextSession(label: string) {
  const upcoming = await db.academicSession.findFirst({ where: { status: "UPCOMING" }, select: { label: true } });
  if (upcoming) throw new HttpError(409, `${upcoming.label} is already the next session. Activate it before creating another.`);

  const duplicate = await db.academicSession.findUnique({ where: { label }, select: { id: true } });
  if (duplicate) throw new HttpError(409, `The session ${label} already exists.`);

  const active = await db.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { label: true } });
  if (active && label !== labelAfter(active.label)) {
    throw new HttpError(400, `The next session after ${active.label} must be ${labelAfter(active.label)}.`);
  }

  await createSessionWithTemplate(db, label, "UPCOMING");
}

export async function activateNextSession() {
  const upcoming = await db.academicSession.findFirst({ where: { status: "UPCOMING" }, select: { id: true, label: true } });
  if (!upcoming) throw new HttpError(409, "There is no next session to activate. Create one first.");

  await db.$transaction([
    db.academicSession.updateMany({ where: { status: "ACTIVE" }, data: { status: "CLOSED" } }),
    db.academicSession.update({ where: { id: upcoming.id }, data: { status: "ACTIVE" } }),
  ]);
  return upcoming.label;
}
