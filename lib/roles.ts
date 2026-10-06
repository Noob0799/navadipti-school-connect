import type { Role } from "@prisma/client";

export const HOME_PATH: Record<Role, string> = {
  PRINCIPAL: "/principal",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export const ROLE_LABEL: Record<Role, string> = {
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export const NAV_BY_ROLE: Partial<Record<Role, { href: string; label: string }[]>> = {
  PRINCIPAL: [
    { href: "/principal", label: "Dashboard" },
    { href: "/principal/teachers", label: "Teachers" },
    { href: "/principal/classes", label: "Class assignments" },
    { href: "/principal/students", label: "Students" },
    { href: "/principal/promotion", label: "Promotion" },
    { href: "/principal/sessions", label: "Sessions" },
    { href: "/principal/homework", label: "Homework" },
    { href: "/principal/tests", label: "Tests" },
    { href: "/principal/syllabus", label: "Syllabus" },
  ],
  TEACHER: [
    { href: "/teacher", label: "Dashboard" },
    { href: "/teacher/homework", label: "Homework" },
    { href: "/teacher/tests", label: "Tests & grading" },
    { href: "/teacher/syllabus", label: "Syllabus" },
  ],
  STUDENT: [
    { href: "/student", label: "Home" },
    { href: "/student/homework", label: "Homework" },
    { href: "/student/tests", label: "Tests" },
    { href: "/student/syllabus", label: "Syllabus" },
    { href: "/student/results", label: "Results" },
  ],
};
