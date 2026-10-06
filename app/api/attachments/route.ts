import type { AttachmentOwnerType } from "@prisma/client";
import { uploadAttachment } from "@/features/attachments/service";
import { HttpError } from "@/lib/errors";
import { withRole } from "@/lib/rbac";

const OWNER_TYPES: AttachmentOwnerType[] = ["HOMEWORK", "TEST", "SYLLABUS", "HOMEWORK_SUBMISSION", "TEST_SUBMISSION"];

export const POST = withRole(["STUDENT", "TEACHER"], async (request, _context, session) => {
  const form = await request.formData();
  const ownerType = String(form.get("ownerType") ?? "") as AttachmentOwnerType;
  const ownerId = String(form.get("ownerId") ?? "");
  const file = form.get("file");

  if (!OWNER_TYPES.includes(ownerType) || !ownerId) throw new HttpError(400, "Choose what this file belongs to.");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload.");

  return Response.json(await uploadAttachment(session, ownerType, ownerId, file), { status: 201 });
});
