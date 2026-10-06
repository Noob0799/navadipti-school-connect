import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { Box, Container, Stack, Typography } from "@mui/material";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { HOME_PATH, NAV_BY_ROLE, ROLE_LABEL } from "@/lib/roles";
import { LogoutButton } from "@/components/logout-button";
import { NavButton } from "@/components/nav-button";
import { NotificationBell } from "@/components/notification-bell";

export async function RoleArea({ role, children }: { role: Role; children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(HOME_PATH[session.role]);

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });
  const nav = NAV_BY_ROLE[role] ?? [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          py: 1.5,
          bgcolor: "#1F3430",
          color: "#F4F7F2",
          borderBottom: "4px solid",
          borderColor: "primary.main",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h3" sx={{ fontSize: 20, color: "inherit" }}>
          Navadipti School Connect
        </Typography>
        <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
          {nav.map((item) => (
            <NavButton key={item.href} href={item.href} label={item.label} />
          ))}
        </Stack>
        <Box sx={{ ml: "auto", textAlign: "right" }}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {user?.name ?? "Signed in"} · {ROLE_LABEL[role]}
          </Typography>
        </Box>
        {(role === "STUDENT" || role === "TEACHER") && <NotificationBell />}
        <NavButton href="/profile" label="Profile" />
        <LogoutButton />
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
