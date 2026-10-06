import type { AttachmentOwnerType } from "@prisma/client";
import { db } from "@/lib/db";

export type FileRef = { id: string; name: string };

export async function filesByOwner(ownerType: AttachmentOwnerType, ownerIds: string[]) {
  const map = new Map<string, FileRef[]>();
  if (ownerIds.length === 0) return map;

  const rows = await db.attachment.findMany({
    where: { ownerType, ownerId: { in: ownerIds } },
    orderBy: { uploadedAt: "asc" },
    select: { id: true, ownerId: true, originalFilename: true },
  });
  for (const row of rows) {
    const list = map.get(row.ownerId) ?? [];
    list.push({ id: row.id, name: row.originalFilename });
    map.set(row.ownerId, list);
  }
  return map;
}
