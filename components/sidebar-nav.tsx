"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

const ICONS: Record<string, ElementType> = {
  Dashboard: SpaceDashboardOutlinedIcon,
  Home: HomeOutlinedIcon,
  Teachers: GroupsOutlinedIcon,
  "Class assignments": ClassOutlinedIcon,
  Students: SchoolOutlinedIcon,
  Promotion: TrendingUpOutlinedIcon,
  Sessions: EventRepeatOutlinedIcon,
  Homework: AssignmentOutlinedIcon,
  Tests: QuizOutlinedIcon,
  "Tests & grading": QuizOutlinedIcon,
  Syllabus: MenuBookOutlinedIcon,
  Results: BarChartOutlinedIcon,
};

type NavItem = { href: string; label: string };

export function SidebarNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const activeHref = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  return (
    <List
      sx={{
        py: { xs: 0, sm: 1.25 },
        display: "flex",
        flexDirection: { xs: "row", sm: "column" },
        overflowX: { xs: "auto", sm: "visible" },
      }}
    >
      {nav.map((item) => {
        const Icon = ICONS[item.label] ?? SpaceDashboardOutlinedIcon;
        const active = item.href === activeHref;
        return (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={active}
            disableRipple
            sx={{
              flexShrink: 0,
              gap: 1,
              px: 2.25,
              py: 1.1,
              borderRadius: 0,
              borderLeft: { xs: 0, sm: "4px solid transparent" },
              borderBottom: { xs: "4px solid transparent", sm: 0 },
              color: "text.primary",
              textDecoration: "none",
              "&.Mui-selected": {
                bgcolor: "transparent",
                color: "primary.main",
                borderLeftColor: "primary.main",
                borderBottomColor: "primary.main",
              },
              "&.Mui-selected:hover": { bgcolor: "background.default" },
              "&:hover": { bgcolor: "background.default" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
