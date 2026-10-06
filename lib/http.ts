import type { z, ZodTypeAny } from "zod";
import { HttpError } from "@/lib/errors";

export async function parseBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.output<S>> {
  const json = await request.json().catch(() => null);
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Check the details and try again.");
  }
  return result.data;
}
