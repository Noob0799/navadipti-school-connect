import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const HOME: Record<Role, string> = {
  PRINCIPAL: "/principal",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const AREA_ROLE: Record<string, Role> = {
  "/principal": "PRINCIPAL",
  "/teacher": "TEACHER",
  "/student": "STUDENT",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/login") {
    return session
      ? NextResponse.redirect(new URL(HOME[session.role], request.url))
      : NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(HOME[session.role], request.url));
  }

  const area = Object.keys(AREA_ROLE).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (area && AREA_ROLE[area] !== session.role) {
    return NextResponse.redirect(new URL(HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
