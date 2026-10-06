import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { Box, Container, Typography } from "@mui/material";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { HOME_PATH, NAV_BY_ROLE, ROLE_LABEL } from "@/lib/roles";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { ProfileIconButton } from "@/components/profile-icon-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { RoleTheme } from "@/components/role-theme";

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
    <RoleTheme role={role}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
            px: { xs: 1.5, sm: 3 },
            py: 1.5,
            bgcolor: "#1F3430",
            color: "#F4F7F2",
            borderBottom: "4px solid",
            borderColor: "primary.main",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#F4B73E", flexShrink: 0 }} />
            <Typography variant="h3" sx={{ fontSize: 20, color: "inherit", display: { xs: "none", sm: "block" } }}>
              Navadipti School Connect
            </Typography>
            <Typography variant="h3" sx={{ fontSize: 16, color: "inherit", display: { xs: "block", sm: "none" } }}>
              Navadipti
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}>
              {user?.name ?? "Signed in"}
            </Typography>
            <Box
              sx={{
                px: 1.1,
                py: 0.25,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {ROLE_LABEL[role]}
            </Box>
            {(role === "STUDENT" || role === "TEACHER") && <NotificationBell />}
            <ProfileIconButton />
            <LogoutButton />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, flexGrow: 1, minHeight: 0 }}>
          <Box
            component="nav"
            sx={{
              width: { sm: 252 },
              flexShrink: 0,
              bgcolor: "background.paper",
              borderRight: { sm: "1px solid" },
              borderBottom: { xs: "1px solid", sm: "none" },
              borderColor: "divider",
            }}
          >
            <SidebarNav nav={nav} />
          </Box>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              backgroundImage: "radial-gradient(#D8E4DE 1.1px, transparent 1.3px)",
              backgroundSize: "22px 22px",
            }}
          >
            <Container maxWidth="lg" sx={{ py: 4 }}>
              {children}
            </Container>
          </Box>
        </Box>
      </Box>
    </RoleTheme>
  );
}
