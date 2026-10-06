"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@mui/material";

export function LogoutButton() {
  const router = useRouter();
  const logout = useMutation({
    mutationFn: () => fetch("/api/auth/logout", { method: "POST" }),
    onSettled: () => router.replace("/login"),
  });

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      sx={{ color: "#F4F7F2", borderColor: "rgba(244,247,242,0.4)" }}
    >
      Log out
    </Button>
  );
}
