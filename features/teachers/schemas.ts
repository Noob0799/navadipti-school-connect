import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Enter a 10-digit phone number");

export const teacherInputSchema = z.object({
  name: z.string().trim().min(1, "Enter the teacher's name").max(80),
  phoneNumber: phoneNumberSchema,
  employeeInfo: z.string().trim().max(200).optional(),
});

export const teacherUpdateSchema = teacherInputSchema.partial();

export const teacherStatusSchema = z.object({
  active: z.boolean(),
});

export const expertiseSchema = z.object({
  subjectIds: z.array(z.string().min(1)).max(20),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;
export type TeacherUpdate = z.infer<typeof teacherUpdateSchema>;
export type ExpertiseInput = z.infer<typeof expertiseSchema>;
