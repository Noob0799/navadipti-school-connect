import type { Role } from "@prisma/client";
import { errorResponse, HttpError } from "@/lib/errors";
import { getSession, type Session } from "@/lib/session";

export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Sign in to continue.");
  if (!roles.includes(session.role)) throw new HttpError(403, "Your role cannot do this.");
  return session;
}

export function withRole<Context>(
  roles: Role[],
  handler: (request: Request, context: Context, session: Session) => Promise<Response>,
) {
  return async (request: Request, context: Context) => {
    try {
      const session = await requireRole(roles);
      return await handler(request, context, session);
    } catch (error) {
      const response = errorResponse(error);
      if (response) return response;
      throw error;
    }
  };
}
