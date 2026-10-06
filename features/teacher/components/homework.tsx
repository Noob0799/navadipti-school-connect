"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks, FilePreview } from "@/features/student/components/files";
import { formatDate, formatDateTime } from "@/lib/format";
import { useAssignments, useCreateHomework, useSaveRemark, useTeacherHomework, useTeacherHomeworkList, useUpdateHomework } from "../queries";
import { EditableFiles, TeacherUpload } from "./common";

export function TeacherHomeworkList() {
  const list = useTeacherHomeworkList();
  const assignments = useAssignments();
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Homework</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!assignments.data?.length}>New homework</Button>
      </Stack>
      {list.isPending && <Skeleton variant="rounded" height={160} />}
      {list.isError && <Alert severity="error">{list.error.message}</Alert>}
      {list.data?.length === 0 && <Alert severity="info">No homework yet. Create one for a class you teach.</Alert>}
      {list.data?.map((h) => (
        <Card key={h.id}>
          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Stack>
              <Typography variant="h3" sx={{ mb: 0 }}>
                <Link href={`/teacher/homework/${h.id}`} style={{ color: "inherit", textDecoration: "none" }}>{h.title}</Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">{h.className} · {h.subject} · due {formatDate(h.deadlineDate)}</Typography>
            </Stack>
            <Typography variant="body2">
              {h.submittedCount}/{h.expectedCount} submitted · {h.submittedCount === 0 ? "N/A" : h.pendingRemarkCount} to remark
            </Typography>
          </CardContent>
        </Card>
      ))}
      <NewHomeworkDialog open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}

function NewHomeworkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const assignments = useAssignments();
  const create = useCreateHomework();
  const [offeringSubjectId, setOfferingSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    if (!offeringSubjectId || !title || !deadlineDate) return setError("Choose a class, add a title and set a due date.");
    create.mutate(
      { offeringSubjectId, title, description, deadlineDate },
      {
        onSuccess: () => {
          setTitle(""); setDescription(""); setDeadlineDate("");
          onClose();
        },
        onError: (e) => setError(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New homework</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select label="Class and subject" value={offeringSubjectId} onChange={(e) => setOfferingSubjectId(e.target.value)}>
            {(assignments.data ?? []).map((a) => (
              <MenuItem key={a.offeringSubjectId} value={a.offeringSubjectId}>{a.className} · {a.subjectName}</MenuItem>
            ))}
          </TextField>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Instructions" multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField label="Due date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={create.isPending}>
          {create.isPending ? "Posting…" : "Post to class"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TeacherHomeworkDetail({ id, readOnly = false, backHref = "/teacher/homework" }: { id: string; readOnly?: boolean; backHref?: string }) {
  const homework = useTeacherHomework(id);
  const update = useUpdateHomework(id);
  const [review, setReview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (homework.isPending) return <Skeleton variant="rounded" height={320} />;
  if (homework.isError) return <Alert severity="error">{homework.error.message}</Alert>;
  const item = homework.data;
  const reviewing = item.submissions.find((s) => s.submissionId === review) ?? null;
  const pendingRemark = item.submissions.filter((s) => s.submitted && !s.remark).length;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.title}</Typography>
        <Typography color="text.secondary">{item.className} · {item.subject} · due {formatDate(item.deadlineDate)}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Instructions and material</Typography>
            {!readOnly && <Button size="small" onClick={() => setEditing((v) => !v)}>{editing ? "Close" : "Edit"}</Button>}
          </Stack>
          {editing ? (
            <EditForm
              initial={{ title: item.title, description: item.description, deadlineDate: item.deadlineDate.slice(0, 10) }}
              pending={update.isPending}
              error={update.error?.message ?? null}
              onSave={(values) => update.mutate(values, { onSuccess: () => setEditing(false) })}
            />
          ) : (
            <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{item.description || "No instructions."}</Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Question paper and material</Typography>
          {readOnly ? <FileLinks files={item.materials} /> : (
            <>
              <EditableFiles files={item.materials} />
              <Stack sx={{ mt: 1 }}>
                <TeacherUpload ownerType="HOMEWORK" ownerId={item.id} label="Attach file" />
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h3">Submissions</Typography>
          {item.submissions.some((s) => s.submitted)
            ? <Chip size="small" color={pendingRemark ? "warning" : "success"} label={`${pendingRemark} to remark`} />
            : <Chip size="small" label="N/A to remark" />}
        </Stack>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>School ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted on</TableCell>
                <TableCell>Remark</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {item.submissions.map((s) => (
                <TableRow key={s.studentId} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{s.schoolId}</TableCell>
                  <TableCell>
                    {!s.submitted
                      ? <Chip size="small" label="Not submitted" />
                      : <Chip size="small" color={s.late ? "warning" : "success"} label={s.late ? "Late" : "Submitted"} />}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{s.submittedAt ? formatDateTime(s.submittedAt) : "–"}</TableCell>
                  <TableCell>{s.remark || "–"}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" disabled={!s.submitted} onClick={() => setReview(s.submissionId)}>{readOnly ? "View" : "Review"}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </CardContent>
      </Card>

      <Button component={Link} href={backHref} variant="outlined" sx={{ alignSelf: "flex-start" }}>Back to homework</Button>

      {reviewing && (
        <ReviewDialog
          key={reviewing.submissionId}
          readOnly={readOnly}
          open
          files={reviewing.files}
          studentName={reviewing.name}
          submissionId={reviewing.submissionId ?? ""}
          initialRemark={reviewing.remark}
          onClose={() => setReview(null)}
        />
      )}
    </Stack>
  );
}

function EditForm({ initial, pending, error, onSave }: { initial: { title: string; description: string; deadlineDate: string }; pending: boolean; error: string | null; onSave: (values: { title: string; description: string; deadlineDate: string }) => void }) {
  const [values, setValues] = useState(initial);
  return (
    <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
      <TextField label="Instructions" multiline minRows={3} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
      <TextField label="Due date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={values.deadlineDate} onChange={(e) => setValues({ ...values, deadlineDate: e.target.value })} />
      <Button variant="contained" disabled={pending} onClick={() => onSave(values)} sx={{ alignSelf: "flex-start" }}>
        {pending ? "Saving…" : "Save and notify class"}
      </Button>
    </Stack>
  );
}

function ReviewDialog({ open, files, studentName, submissionId, initialRemark, onClose, readOnly = false }: { open: boolean; files: FileRef[]; studentName: string; submissionId: string; initialRemark: string; onClose: () => void; readOnly?: boolean }) {
  const save = useSaveRemark();
  const [remark, setRemark] = useState(initialRemark);
  const [active, setActive] = useState(0);
  const file = files[active];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" key={submissionId}>
      <DialogTitle>{studentName}&apos;s work</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            {files.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                {files.map((f, i) => (
                  <Button key={f.id} size="small" variant={i === active ? "contained" : "outlined"} onClick={() => setActive(i)}>{f.name}</Button>
                ))}
              </Stack>
            )}
            {file ? <FilePreview file={file} /> : <Typography color="text.secondary">No file was attached to this submission.</Typography>}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h3">Remark</Typography>
              <TextField multiline minRows={6} label="Remark for the student" value={remark} disabled={readOnly} onChange={(e) => setRemark(e.target.value)} />
              {save.isError && <Alert severity="error">{save.error.message}</Alert>}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Close</Button>
        {!readOnly && (
          <Button variant="contained" disabled={save.isPending} onClick={() => save.mutate({ submissionId, remark }, { onSuccess: onClose })}>
            {save.isPending ? "Saving…" : "Save remark"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
