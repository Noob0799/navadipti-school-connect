"use client";

import { useState } from "react";
import { Badge, Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useMarkNotificationsRead, useNotifications } from "@/features/student/queries";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.data?.unreadCount ?? 0;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead.mutate();
  }

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton aria-label={`Notifications, ${unread} unread`} onClick={toggle} sx={{ color: "#F4F7F2" }}>
        <Badge badgeContent={unread} color="error" max={9}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      {open && (
        <Paper
          elevation={6}
          sx={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "min(340px, calc(100vw - 32px))", maxHeight: 360, overflow: "auto", p: 1, zIndex: 20 }}
        >
          <Stack spacing={0.5}>
            {notifications.data?.items.length === 0 && <Typography variant="body2" sx={{ p: 1 }}>Nothing new.</Typography>}
            {notifications.data?.items.map((item) => (
              <Box key={item.id} sx={{ p: 1, borderRadius: 1, bgcolor: item.isNew ? "action.hover" : "transparent" }}>
                <Typography variant="body2" sx={{ fontWeight: item.isNew ? 700 : 400 }}>{item.message}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString("en-IN")}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
