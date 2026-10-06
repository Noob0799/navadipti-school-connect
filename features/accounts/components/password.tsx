"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { apiRequest } from "@/lib/client-api";
import { changePasswordSchema } from "../schemas";

export function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [temporary, setTemporary] = useState<string | null>(null);
  const reset = useMutation({
    mutationFn: () => apiRequest<{ temporaryPassword: string }>(`/api/users/${userId}/reset-password`, { method: "PATCH" }),
    onSuccess: (r) => setTemporary(r.temporaryPassword),
  });

  function close() {
    setOpen(false);
    setTemporary(null);
    reset.reset();
  }

  return (
    <>
      <Button variant="outlined" color="warning" onClick={() => setOpen(true)}>Reset password</Button>
      <Dialog open={open} onClose={close}>
        <DialogTitle>Reset password for {name}?</DialogTitle>
        <DialogContent>
          {temporary ? (
            <Stack spacing={2}>
              <Alert severity="warning">Share this temporary password now. It will not be shown again.</Alert>
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 20 }}>{temporary}</Typography>
            </Stack>
          ) : (
            <DialogContentText>
              The current password stops working straight away. You will get a new temporary password to share.
            </DialogContentText>
          )}
          {reset.isError && <Alert severity="error" sx={{ mt: 2 }}>{reset.error.message}</Alert>}
        </DialogContent>
        <DialogActions>
          {temporary ? (
            <Button variant="contained" onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outlined" onClick={close}>Cancel</Button>
              <Button variant="contained" color="warning" disabled={reset.isPending} onClick={() => reset.mutate()}>
                {reset.isPending ? "Resetting…" : "Reset password"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ChangePasswordCard({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const change = useMutation({
    mutationFn: () =>
      apiRequest(`/api/users/${userId}/change-password`, { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) }),
    onSuccess: () => {
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    },
    onError: (e) => setError(e.message),
  });

  function submit() {
    setError(null);
    setDone(false);
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (newPassword !== confirm) return setError("The new passwords do not match.");
    change.mutate();
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Change password</Typography>
        <Stack spacing={2} sx={{ mt: 1, maxWidth: 400 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {done && <Alert severity="success" onClose={() => setDone(false)}>Your password has been changed.</Alert>}
          <TextField label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <TextField label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} helperText="At least 8 characters" />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button variant="contained" onClick={submit} disabled={change.isPending} sx={{ alignSelf: "flex-start" }}>
            {change.isPending ? "Saving…" : "Change password"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
