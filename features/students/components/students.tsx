"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useClassOfferings } from "@/features/teachers/queries";
import { useEnrollStudent, useStudent, useStudents, useUpdateStudent, useWithdrawEnrollment, type StudentRow } from "../queries";
import { phoneNumberSchema } from "@/features/teachers/schemas";
import { ResetPasswordButton } from "@/features/accounts/components/password";

export function StudentList() {
  const students = useStudents();
  const withdraw = useWithdrawEnrollment();
  const [target, setTarget] = useState<StudentRow | null>(null);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Students</Typography>
        <Button component={Link} href="/principal/students/new" variant="contained">Enrol student</Button>
      </Stack>
      {students.isPending && <Skeleton variant="rounded" height={200} />}
      {students.isError && <Alert severity="error">{students.error.message}</Alert>}
      {students.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>School ID</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {students.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Link href={`/principal/students/${s.id}`} style={{ color: "inherit" }}>{s.name}</Link>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{s.schoolId}</TableCell>
                  <TableCell>{s.className ?? "–"}</TableCell>
                  <TableCell>
                    {s.enrollmentStatus === "ENROLLED" && <Chip size="small" color="success" label="Enrolled" />}
                    {s.enrollmentStatus === "WITHDRAWN" && <Chip size="small" label="Withdrawn" />}
                    {s.enrollmentStatus === null && <Chip size="small" label="Not in this session" />}
                    {s.enrollmentStatus && !["ENROLLED", "WITHDRAWN"].includes(s.enrollmentStatus) && <Chip size="small" label={s.enrollmentStatus.toLowerCase()} />}
                  </TableCell>
                  <TableCell align="right">
                    {s.enrollmentStatus === "ENROLLED" && s.enrollmentId && (
                      <Button size="small" color="error" onClick={() => setTarget(s)}>Withdraw</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={target !== null} onClose={() => setTarget(null)}>
        <DialogTitle>Withdraw {target?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Their account will be locked, and their past work stays on record. This can&apos;t be reversed from this screen.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={withdraw.isPending} onClick={() => withdraw.mutate(target!.enrollmentId!, { onSuccess: () => setTarget(null) })}>
            Withdraw student
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function NewStudent() {
  const offerings = useClassOfferings();
  const enrol = useEnrollStudent();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [classOfferingId, setClassOfferingId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (enrol.isSuccess) {
    const { schoolId: issued, temporaryPassword } = enrol.data;
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">{name} is enrolled</Typography>
            <Typography>School ID: <b style={{ fontFamily: "var(--font-mono)" }}>{issued}</b></Typography>
            <Alert severity="warning">Share this temporary password now. It will not be shown again.</Alert>
            <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 20 }}>{temporaryPassword}</Typography>
            <Button component={Link} href="/principal/students" variant="contained" sx={{ alignSelf: "flex-start" }}>Back to students</Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  function submit() {
    setError(null);
    const parsed = phoneNumberSchema.safeParse(phone);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    enrol.mutate(
      { name, phoneNumber: phone, classOfferingId, schoolId: schoolId || undefined },
      { onError: (e) => setError(e.message) },
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5} sx={{ maxWidth: 440 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Student's name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Parent or student phone number" value={phone} onChange={(e) => setPhone(e.target.value)} helperText="10 digits. Used to sign in." />
          <TextField select label="Class" value={classOfferingId} onChange={(e) => setClassOfferingId(e.target.value)} disabled={!offerings.data?.session}>
            {offerings.data?.classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Existing school ID (optional)"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            helperText="Only for students from the offline system. Leave blank to generate one."
          />
          <Button variant="contained" onClick={submit} disabled={enrol.isPending || !name || !phone || !classOfferingId} sx={{ alignSelf: "flex-start" }}>
            {enrol.isPending ? "Enrolling…" : "Enrol student"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StudentDetail({ id }: { id: string }) {
  const student = useStudent(id);
  const update = useUpdateStudent(id);
  const withdraw = useWithdrawEnrollment();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (student.isPending) return <Skeleton variant="rounded" height={260} />;
  if (student.isError) return <Alert severity="error">{student.error.message}</Alert>;
  const s = student.data;
  const current = s.enrollments.find((e) => e.status === "ENROLLED" && e.sessionStatus === "ACTIVE");

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{s.name}</Typography>
        <Chip label={s.schoolId} sx={{ fontFamily: "var(--font-mono)" }} />
        {s.status === "INACTIVE" && <Chip label="Account locked" />}
      </Stack>
      {message && <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert>}
      {update.isError && <Alert severity="error">{update.error.message}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h3">Details</Typography>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 440 }}>
            <TextField label="Name" value={name ?? s.name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Phone number" value={phone ?? s.phoneNumber} onChange={(e) => setPhone(e.target.value)} />
            <Button
              variant="contained"
              sx={{ alignSelf: "flex-start" }}
              disabled={update.isPending}
              onClick={() => update.mutate({ name: name ?? s.name, phoneNumber: phone ?? s.phoneNumber }, { onSuccess: () => setMessage("Details saved.") })}
            >
              Save details
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h3">Academic history</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {s.enrollments.map((e) => (
              <Typography key={e.id} variant="body2">
                <b style={{ fontFamily: "var(--font-mono)" }}>{e.sessionLabel}</b> · {e.className} · {e.status.toLowerCase()}
              </Typography>
            ))}
            {s.enrollments.length === 0 && <Typography color="text.secondary">Not enrolled yet.</Typography>}
          </Stack>
          {current && (
            <Button color="error" sx={{ mt: 2 }} onClick={() => withdraw.mutate(current.id, { onSuccess: () => setMessage("Student withdrawn.") })} disabled={withdraw.isPending}>
              Withdraw from {current.className}
            </Button>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <ResetPasswordButton userId={s.id} name={s.name} />
        <Button component={Link} href="/principal/students">Back to students</Button>
      </Stack>
    </Stack>
  );
}
