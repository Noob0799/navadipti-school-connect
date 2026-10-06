import { z } from "zod";

export const sessionLabelSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Use the format 2027-28")
  .refine((label) => {
    const start = Number(label.slice(0, 4));
    return Number(label.slice(5)) === (start + 1) % 100;
  }, "The second year must follow the first, like 2027-28");

export const createSessionSchema = z.object({ label: sessionLabelSchema });
