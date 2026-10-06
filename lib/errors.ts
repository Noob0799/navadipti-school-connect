export class HttpError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): Response | null {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}
