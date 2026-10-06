import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Use at least 8 characters").max(100),
});
