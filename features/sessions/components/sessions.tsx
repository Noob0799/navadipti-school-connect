"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography } from "@mui/material";
import { apiRequest } from "@/lib/client-api";
import { sessionLabelSchema } from "../schemas";

type SessionRow = { id: string; label: string; status: "UPCOMING" | "ACTIVE" | "CLOSED" };
type SessionsResponse = { sessions: SessionRow[]; suggestedNextLabel: string };

const STATUS_CHIP: Record<SessionRow["status"], { label: string; color: "success" | "warning" | "default" }> = {
  ACTIVE: { label: "Active", color: "success" },
  UPCOMING: { label: "Next", color: "warning" },
  CLOSED: { label: "Closed", color: "default" },
};

export function SessionsPage() {
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ["principal", "sessions"], queryFn: () => apiRequest<SessionsResponse>("/api/academic-sessions") });
  const [message, setMessage] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["principal"] });

  if (sessions.isPending) return <Skeleton variant="rounded" height={260} />;
  if (sessions.isError) return <Alert severity="error">{sessions.error.message}</Alert>;
  const data = sessions.data;
  const hasNext = data.sessions.some((s) => s.status === "UPCOMING");

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Academic sessions</Typography>
        <Typography color="text.secondary">Only one session is active at a time. Teachers and students see the active session.</Typography>
      </Stack>

      {message && <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{s.label}</TableCell>
                <TableCell><Chip size="small" label={STATUS_CHIP[s.status].label} color={STATUS_CHIP[s.status].color} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasNext ? (
        <ActivateNextCard nextLabel={data.sessions.find((s) => s.status === "UPCOMING")!.label} onDone={(text) => { setMessage(text); refresh(); }} />
      ) : (
        <CreateNextCard suggested={data.suggestedNextLabel} onDone={(text) => { setMessage(text); refresh(); }} />
      )}
    </Stack>
  );
}

function CreateNextCard({ suggested, onDone }: { suggested: string; onDone: (text: string) => void }) {
  const [label, setLabel] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => apiRequest("/api/academic-sessions", { method: "POST", body: JSON.stringify({ label }) }),
    onSuccess: () => onDone(`${label} created. Classes, subjects and terms were set up from the template.`),
  });

  function submit() {
    setError(null);
    const parsed = sessionLabelSchema.safeParse(label);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    create.mutate(undefined, { onError: (e) => setError(e.message) });
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Create the next session</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          The new session starts as Next. You can prepare it before switching over.
        </Typography>
        <Stack spacing={2} sx={{ maxWidth: 360 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Session" value={label} onChange={(e) => setLabel(e.target.value)} helperText="Format 2027-28" />
          <Button variant="contained" onClick={submit} disabled={create.isPending} sx={{ alignSelf: "flex-start" }}>
            {create.isPending ? "Creating…" : "Create session"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ActivateNextCard({ nextLabel, onDone }: { nextLabel: string; onDone: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activate = useMutation({
    mutationFn: () => apiRequest<{ activated: string }>("/api/academic-sessions/activate-next", { method: "POST" }),
    onSuccess: (r) => {
      setOpen(false);
      onDone(`${r.activated} is now the active session.`);
    },
    onError: (e) => setError(e.message),
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Switch to {nextLabel}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Make sure promotions are done for the current session first. Switching closes the current session, and teachers and students immediately see {nextLabel}.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Button variant="contained" onClick={() => setOpen(true)}>Activate {nextLabel}</Button>
      </CardContent>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Activate {nextLabel}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The current session will be closed. This can&apos;t be undone from this screen.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={activate.isPending} onClick={() => activate.mutate()}>
            {activate.isPending ? "Switching…" : `Switch to ${nextLabel}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
