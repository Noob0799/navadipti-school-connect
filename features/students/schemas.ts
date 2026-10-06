import { z } from "zod";
import { phoneNumberSchema } from "@/features/teachers/schemas";

export const enrollStudentSchema = z.object({
  name: z.string().trim().min(1, "Enter the student's name").max(80),
  phoneNumber: phoneNumberSchema,
  classOfferingId: z.string().min(1, "Choose a class"),
  schoolId: z.string().trim().max(40).optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(1, "Enter the student's name").max(80).optional(),
  phoneNumber: phoneNumberSchema.optional(),
});

export const promoteSchema = z.object({
  promotedStudentIds: z.array(z.string().min(1)).max(500),
});
