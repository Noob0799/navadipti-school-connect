"use client";

import Link from "next/link";
import { Button } from "@mui/material";

export function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <Button component={Link} href={href} size="small" sx={{ color: "#F4F7F2" }}>
      {label}
    </Button>
  );
}
