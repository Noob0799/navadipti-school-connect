"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks, FilePreview } from "@/features/student/components/files";
import { TERM_NAMES, TERM_SCALE } from "@/lib/academic";
import { useAssignments, useGradeSubmission, useReleaseGrades, useSaveTest, useTeacherTest, useTeacherTestList, useUpdateTest } from "../queries";
import { formatDate } from "@/lib/format";
import { FileStagingGrid, useFileStaging } from "./common";

export function TeacherTestList() {
  const list = useTeacherTestList();
  const assignments = useAssignments();
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Tests and grading</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!assignments.data?.length}>New test</Button>
      </Stack>
      {list.isPending && <Skeleton variant="rounded" height={160} />}
      {list.isError && <Alert severity="error">{list.error.message}</Alert>}
      {list.data?.length === 0 && <Alert severity="info">No tests yet. Set one up for a class and term.</Alert>}
      {list.data && list.data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Out of</TableCell>
                <TableCell>Answered</TableCell>
                <TableCell>To grade</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{t.className}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.termLabel}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{t.max}</TableCell>
                  <TableCell>
                    <Chip size="small" label={`${t.answeredCount}/${t.expectedCount}`} />
                  </TableCell>
                  <TableCell>
                    {t.answeredCount === 0
                      ? <Chip size="small" label="N/A" />
                      : <Chip size="small" color={t.ungradedCount ? "warning" : "success"} label={t.ungradedCount ? `${t.ungradedCount}` : "All graded"} />}
                  </TableCell>
                  <TableCell>
                    <Button component={Link} href={`/teacher/tests/${t.id}`} size="small" variant="outlined">Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <NewTestDialog open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}

function NewTestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const assignments = useAssignments();
  const save = useSaveTest();
  const staging = useFileStaging([], "TEST");
  const [offeringSubjectId, setOfferingSubjectId] = useState("");
  const [termName, setTermName] = useState("CT1");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!offeringSubjectId || !deadlineDate) return setError("Choose a class and set a deadline.");
    if (staging.pendingFiles.length === 0) return setError("Attach the question paper.");
    save.mutate({ offeringSubjectId, termName, deadlineDate }, {
      onSuccess: async (result) => {
        try {
          await staging.commit(result.id);
          setDeadlineDate("");
          onClose();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Test was saved, but some attachments failed to upload.");
        }
      },
      onError: (e) => setError(e.message),
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New test</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select label="Class and subject" value={offeringSubjectId} onChange={(e) => setOfferingSubjectId(e.target.value)}>
            {(assignments.data ?? []).map((a) => <MenuItem key={a.offeringSubjectId} value={a.offeringSubjectId}>{a.className} · {a.subjectName}</MenuItem>)}
          </TextField>
          <TextField select label="Term" value={termName} onChange={(e) => setTermName(e.target.value)}>
            {TERM_NAMES.map((name) => <MenuItem key={name} value={name}>{TERM_SCALE[name].label} (out of {TERM_SCALE[name].max})</MenuItem>)}
          </TextField>
          <TextField label="Deadline" type="date" slotProps={{ inputLabel: { shrink: true } }} value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Question paper</Typography>
            <FileStagingGrid staging={staging} label="Attach question paper" />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending || staging.busy}>
          {save.isPending || staging.busy ? "Saving…" : "Save and notify class"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TeacherTestDetail({ id, readOnly = false, backHref = "/teacher/tests" }: { id: string; readOnly?: boolean; backHref?: string }) {
  const test = useTeacherTest(id);
  const release = useReleaseGrades();
  const update = useUpdateTest(id);
  const staging = useFileStaging(test.data?.paper ?? [], "TEST");
  const [grading, setGrading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (test.isPending) return <Skeleton variant="rounded" height={320} />;
  if (test.isError) return <Alert severity="error">{test.error.message}</Alert>;
  const item = test.data;
  const active = grading ? item.students.find((s) => s.submissionId === grading) ?? null : null;
  const ungraded = item.students.filter((s) => s.answered && s.marks === null).length;
  const readyToRelease = item.students.length > 0 && item.students.every((s) => s.answered && s.marks !== null);

  function cancelEdit() {
    staging.discard();
    setSaveError(null);
    setEditing(false);
  }

  async function saveQuestionPaper() {
    setSaveError(null);
    if (staging.visibleFiles.length + staging.pendingFiles.length === 0) return setSaveError("Attach the question paper.");
    update.mutate({}, {
      onSuccess: async () => {
        try {
          await staging.commit(item.id);
          setEditing(false);
        } catch (e) {
          setSaveError(e instanceof Error ? e.message : "Saved, but some attachment changes failed.");
        }
      },
      onError: (e) => setSaveError(e.message),
    });
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.subject} · {item.termLabel}</Typography>
        <Typography color="text.secondary">{item.className} · out of {item.max} · pass {item.pass} · deadline {formatDate(item.deadlineDate)}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Question paper</Typography>
            {!readOnly && !editing && <Button size="small" onClick={() => setEditing(true)}>Edit</Button>}
          </Stack>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}
            {editing ? (
              <>
                <FileStagingGrid staging={staging} label="Attach question paper" />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    disabled={update.isPending || staging.busy}
                    onClick={saveQuestionPaper}
                  >
                    {update.isPending || staging.busy ? "Saving…" : "Save and notify class"}
                  </Button>
                  <Button variant="outlined" disabled={update.isPending || staging.busy} onClick={cancelEdit}>Cancel</Button>
                </Stack>
              </>
            ) : (
              <FileLinks files={item.paper} />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="h3">Answers</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {item.students.every((s) => !s.answered)
                ? <Chip size="small" label="N/A to grade" />
                : <Chip size="small" color={ungraded ? "warning" : "success"} label={`${ungraded} to grade`} />}
              {!readOnly && <Button
                variant="outlined"
                disabled={release.isPending || !readyToRelease}
                onClick={() => release.mutate(item.id, {
                  onSuccess: () => setMessage("Class notified that grades are out."),
                })}
              >
                Release grades to class
              </Button>}
            </Stack>
          </Stack>
          {!readOnly && !readyToRelease && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Release unlocks once every student has submitted and every answer is graded.
            </Typography>
          )}
          {release.isError && <Alert severity="error" sx={{ mt: 2 }}>{release.error.message}</Alert>}
          {message && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMessage(null)}>{message}</Alert>}
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>School ID</TableCell>
                  <TableCell>Answer</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.students.map((s) => (
                  <TableRow key={s.studentId} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                    <TableCell sx={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{s.schoolId}</TableCell>
                    <TableCell>{s.answered ? <Chip size="small" color="success" label="Answered" /> : <Chip size="small" label="No answer" />}</TableCell>
                    <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{s.marks === null ? "–" : `${s.marks}/${item.max}`}</TableCell>
                    <TableCell>
                      {s.marks === null
                        ? (s.answered ? <Chip size="small" color="warning" label="Not graded" /> : "–")
                        : <Chip size="small" color={s.marks >= item.pass ? "success" : "error"} label={s.marks >= item.pass ? "Pass" : "Fail"} />}
                    </TableCell>
                    <TableCell>{s.remark || "–"}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" disabled={!s.answered} onClick={() => setGrading(s.submissionId)}>
                        {readOnly ? "View" : s.marks === null ? "Grade" : "Open"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Button component={Link} href={backHref} variant="outlined" sx={{ alignSelf: "flex-start" }}>Back to tests</Button>

      <GradeDialog readOnly={readOnly} key={grading ?? "none"} open={active !== null} submissionId={active?.submissionId ?? ""} studentName={active?.name ?? ""} files={active?.files ?? []} max={item.max} initialMarks={active?.marks ?? null} initialRemark={active?.remark ?? ""} onClose={() => setGrading(null)} />
    </Stack>
  );
}

function GradeDialog({ open, submissionId, studentName, files, max, initialMarks, initialRemark, onClose, readOnly = false }: {
  open: boolean; submissionId: string; studentName: string; files: FileRef[]; max: number; initialMarks: number | null; initialRemark: string; onClose: () => void; readOnly?: boolean;
}) {
  const grade = useGradeSubmission();
  const [marks, setMarks] = useState(initialMarks === null ? "" : String(initialMarks));
  const [remark, setRemark] = useState(initialRemark);
  const [active, setActive] = useState(0);
  const file = files[active];
  const value = marks === "" ? null : Number(marks);
  const invalid = value !== null && (!Number.isInteger(value) || value < 0 || value > max);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{studentName}&apos;s answer</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            {files.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                {files.map((f, i) => <Button key={f.id} size="small" variant={i === active ? "contained" : "outlined"} onClick={() => setActive(i)}>{f.name}</Button>)}
              </Stack>
            )}
            {file ? <FilePreview file={file} /> : <Typography color="text.secondary">No answer file.</Typography>}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h3">Grade</Typography>
              <TextField
                label={`Marks (out of ${max})`}
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={readOnly}
                error={invalid}
                helperText={invalid ? `Enter a whole number from 0 to ${max}` : " "}
                slotProps={{ htmlInput: { min: 0, max, step: 1 } }}
              />
              <TextField multiline minRows={5} label="Remark" value={remark} disabled={readOnly} onChange={(e) => setRemark(e.target.value)} />
              {grade.isError && <Alert severity="error">{grade.error.message}</Alert>}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={readOnly || grade.isPending}
          onClick={() => {
            if (invalid) return;
            grade.mutate({ submissionId, marksObtained: value, remark }, { onSuccess: onClose });
          }}
        >
          {grade.isPending ? "Saving…" : "Save grade"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
