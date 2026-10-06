import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";

export async function resetPassword(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role === "PRINCIPAL") throw new HttpError(404, "Account not found.");

  const temporaryPassword = randomBytes(9).toString("base64url");
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(temporaryPassword, 10) },
  });
  return temporaryPassword;
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new HttpError(404, "Account not found.");

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new HttpError(400, "Your current password is not right.");
  if (currentPassword === newPassword) throw new HttpError(400, "Choose a password you have not used just now.");

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
}
