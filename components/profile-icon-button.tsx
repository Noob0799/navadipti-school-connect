"use client";

import Link from "next/link";
import { IconButton } from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

export function ProfileIconButton() {
  return (
    <IconButton
      component={Link}
      href="/profile"
      aria-label="Profile"
      sx={{ color: "#F4F7F2", border: "1px solid rgba(244,247,242,0.3)" }}
    >
      <PersonOutlineOutlinedIcon fontSize="small" />
    </IconButton>
  );
}
