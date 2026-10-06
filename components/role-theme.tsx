"use client";

import { useMemo, type ReactNode } from "react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import type { Role } from "@prisma/client";

const ROLE_ACCENT: Record<Role, { main: string; contrastText: string }> = {
  PRINCIPAL: { main: "#1D4E89", contrastText: "#FFFFFF" },
  TEACHER: { main: "#0F8B6D", contrastText: "#FFFFFF" },
  STUDENT: { main: "#E8772E", contrastText: "#1B1206" },
};

export function RoleTheme({ role, children }: { role: Role; children: ReactNode }) {
  const base = useTheme();
  const theme = useMemo(() => createTheme(base, { palette: { primary: ROLE_ACCENT[role] } }), [base, role]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
