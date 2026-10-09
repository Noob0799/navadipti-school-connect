import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const homeworkInputSchema = z.object({
  offeringSubjectId: z.string().min(1, "Choose a class and subject"),
  title: z.string().trim().min(1, "Enter a title").max(120),
  description: z.string().trim().max(2000).default(""),
  deadlineDate: isoDate,
});

export const homeworkUpdateSchema = homeworkInputSchema.omit({ offeringSubjectId: true }).partial();

export const remarkSchema = z.object({
  remark: z.string().trim().max(1000),
});

export const testInputSchema = z.object({
  deadlineDate: isoDate,
});

export const testUpdateSchema = testInputSchema.partial();

export const gradeSchema = z.object({
  marksObtained: z.number().int("Marks must be a whole number").min(0, "Marks cannot be negative").nullable(),
  remark: z.string().trim().max(1000).default(""),
});

export const syllabusSchema = z.object({
  content: z.string().trim().max(5000),
});

export const termNameSchema = z.enum(["CT1", "HALF_YEARLY", "CT2", "ANNUAL"]);

export type HomeworkInput = z.infer<typeof homeworkInputSchema>;
export type HomeworkUpdate = z.infer<typeof homeworkUpdateSchema>;
export type TestInput = z.infer<typeof testInputSchema>;
export type TestUpdate = z.infer<typeof testUpdateSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
