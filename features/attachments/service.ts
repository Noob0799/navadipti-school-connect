import type { AttachmentOwnerType } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { deleteStoredFile, readStoredFile, saveFile } from "@/lib/storage";
import type { Session } from "@/lib/session";
import { findCurrentClass } from "@/features/student/context";
import { teacherOwnsOwner } from "@/features/teacher/service";

const MAX_BYTES = 10 * 1024 * 1024;

const TYPES = {
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
} as const;

type FileKind = keyof typeof TYPES;

const SUBMISSION_TYPES: AttachmentOwnerType[] = ["HOMEWORK_SUBMISSION", "TEST_SUBMISSION"];
const TEACHER_UPLOAD_TYPES: AttachmentOwnerType[] = ["HOMEWORK", "TEST", "SYLLABUS"];

function kindOf(filename: string): FileKind | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "png") return "png";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  return null;
}

function hasSignature(buffer: Buffer, kind: FileKind) {
  return TYPES[kind].magic.every((byte, i) => buffer[i] === byte);
}

async function assertOwnSubmission(ownerType: AttachmentOwnerType, ownerId: string, studentId: string) {
  const found =
    ownerType === "HOMEWORK_SUBMISSION"
      ? await db.homeworkSubmission.findFirst({ where: { id: ownerId, studentId }, select: { id: true } })
      : await db.testSubmission.findFirst({ where: { id: ownerId, studentId }, select: { id: true } });
  if (!found) throw new HttpError(404, "Submission not found.");
}

export async function uploadAttachment(session: Session, ownerType: AttachmentOwnerType, ownerId: string, file: File) {
  if (session.role === "TEACHER") {
    if (!TEACHER_UPLOAD_TYPES.includes(ownerType)) throw new HttpError(400, "Teachers cannot upload to this item.");
    if (!(await teacherOwnsOwner(session.userId, ownerType, ownerId))) throw new HttpError(404, "Not found in your classes.");
  } else {
    if (!SUBMISSION_TYPES.includes(ownerType)) throw new HttpError(400, "Only your submissions can take uploads.");
    await assertOwnSubmission(ownerType, ownerId, session.userId);
  }

  if (file.size === 0) throw new HttpError(400, "The file is empty.");
  if (file.size > MAX_BYTES) throw new HttpError(400, "Files must be 10 MB or smaller.");

  const kind = kindOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!kind || !hasSignature(buffer, kind)) {
    throw new HttpError(400, "Upload a PDF, JPG or PNG file.");
  }

  const key = await saveFile(buffer, file.name);
  const row = await db.attachment.create({
    data: {
      ownerType,
      ownerId,
      fileUrl: key,
      originalFilename: file.name,
      uploadedById: session.userId,
    },
    select: { id: true, originalFilename: true },
  });
  return { id: row.id, name: row.originalFilename };
}

async function classOfferingForMaterial(ownerType: AttachmentOwnerType, ownerId: string) {
  if (ownerType === "HOMEWORK") {
    const row = await db.homework.findUnique({ where: { id: ownerId }, select: { offeringSubject: { select: { classOfferingId: true } } } });
    return row?.offeringSubject.classOfferingId ?? null;
  }
  if (ownerType === "TEST") {
    const row = await db.test.findUnique({ where: { id: ownerId }, select: { offeringSubject: { select: { classOfferingId: true } } } });
    return row?.offeringSubject.classOfferingId ?? null;
  }
  if (ownerType === "SYLLABUS") {
    const row = await db.syllabus.findUnique({ where: { id: ownerId }, select: { offeringSubject: { select: { classOfferingId: true } } } });
    return row?.offeringSubject.classOfferingId ?? null;
  }
  return null;
}

export async function readAttachment(session: Session, id: string) {
  const row = await db.attachment.findUnique({
    where: { id },
    select: { ownerType: true, ownerId: true, fileUrl: true, originalFilename: true },
  });
  if (!row) throw new HttpError(404, "File not found.");

  if (session.role === "TEACHER") {
    if (!(await teacherOwnsOwner(session.userId, row.ownerType, row.ownerId))) throw new HttpError(404, "File not found.");
  } else if (session.role === "STUDENT") {
    if (SUBMISSION_TYPES.includes(row.ownerType)) {
      await assertOwnSubmission(row.ownerType, row.ownerId, session.userId);
    } else {
      const current = await findCurrentClass(session.userId);
      const classOfferingId = await classOfferingForMaterial(row.ownerType, row.ownerId);
      if (!current || current.classOfferingId !== classOfferingId) throw new HttpError(404, "File not found.");
    }
  }

  const kind = kindOf(row.originalFilename) ?? "pdf";
  return {
    data: await readStoredFile(row.fileUrl),
    contentType: TYPES[kind].mime,
    name: row.originalFilename,
  };
}

export async function deleteAttachment(session: Session, id: string) {
  const row = await db.attachment.findUnique({
    where: { id },
    select: { id: true, ownerType: true, ownerId: true, fileUrl: true, uploadedById: true },
  });
  if (!row || row.uploadedById !== session.userId) throw new HttpError(404, "File not found.");

  if (session.role === "TEACHER") {
    if (!(await teacherOwnsOwner(session.userId, row.ownerType, row.ownerId))) throw new HttpError(404, "File not found.");
  } else if (session.role === "STUDENT") {
    if (!SUBMISSION_TYPES.includes(row.ownerType)) throw new HttpError(404, "File not found.");
    await assertOwnSubmission(row.ownerType, row.ownerId, session.userId);
  }

  await db.attachment.delete({ where: { id: row.id } });
  await deleteStoredFile(row.fileUrl);
}
