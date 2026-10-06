"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Skeleton, Stack, TextField, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks, FilePreview } from "@/features/student/components/files";
import { TERM_NAMES, TERM_SCALE } from "@/lib/academic";
import { useAssignments, useGradeSubmission, useReleaseGrades, useSaveTest, useTeacherTest, useTeacherTestList } from "../queries";
import { EditableFiles, TeacherUpload, formatDate } from "./common";

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
      {list.data?.map((t) => (
        <Card key={t.id}>
          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Stack>
              <Typography variant="h3" sx={{ mb: 0 }}>
                <Link href={`/teacher/tests/${t.id}`} style={{ color: "inherit" }}>{t.title}</Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">{t.className} · {t.subject} · {t.termLabel} · out of {t.max}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={`${t.answeredCount} answered`} />
              <Chip size="small" color={t.ungradedCount ? "warning" : "success"} label={t.ungradedCount ? `${t.ungradedCount} to grade` : "All graded"} />
            </Stack>
          </CardContent>
        </Card>
      ))}
      <NewTestDialog open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}

function NewTestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const assignments = useAssignments();
  const save = useSaveTest();
  const [offeringSubjectId, setOfferingSubjectId] = useState("");
  const [termName, setTermName] = useState("CT1");
  const [title, setTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    save.mutate({ offeringSubjectId, termName, title, deadlineDate }, {
      onSuccess: () => { setTitle(""); setDeadlineDate(""); onClose(); },
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
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Deadline" type="date" slotProps={{ inputLabel: { shrink: true } }} value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending || !offeringSubjectId || !title || !deadlineDate}>
          {save.isPending ? "Saving…" : "Save and notify class"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TeacherTestDetail({ id, readOnly = false }: { id: string; readOnly?: boolean }) {
  const test = useTeacherTest(id);
  const release = useReleaseGrades();
  const [grading, setGrading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (test.isPending) return <Skeleton variant="rounded" height={320} />;
  if (test.isError) return <Alert severity="error">{test.error.message}</Alert>;
  const item = test.data;
  const active = item.students.find((s) => s.submissionId === grading) ?? null;
  const ungraded = item.students.filter((s) => s.answered && s.marks === null).length;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.title}</Typography>
        <Typography color="text.secondary">{item.className} · {item.subject} · {item.termLabel} · out of {item.max} · pass {item.pass} · deadline {formatDate(item.deadlineDate)}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h3">Question paper</Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {readOnly ? <FileLinks files={item.paper} /> : (
              <>
                <EditableFiles files={item.paper} />
                <TeacherUpload ownerType="TEST" ownerId={item.id} label="Attach question paper" />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="h3">Answers</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">{ungraded} to grade</Typography>
              {!readOnly && <Button
                variant="outlined"
                disabled={release.isPending}
                onClick={() => release.mutate(item.id, {
                  onSuccess: (r) => setMessage(r.ungraded ? `Class notified. ${r.ungraded} answer(s) are still ungraded.` : "Class notified that grades are out."),
                })}
              >
                Release grades to class
              </Button>}
            </Stack>
          </Stack>
          {message && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMessage(null)}>{message}</Alert>}
          <Stack divider={<div style={{ borderTop: "1px solid #e3e8f0" }} />} sx={{ mt: 1 }}>
            {item.students.map((s) => (
              <Stack key={s.studentId} direction="row" spacing={2} sx={{ py: 1.5, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <Stack>
                  <Typography sx={{ fontWeight: 700 }}>{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.schoolId}{s.answered ? "" : " · no answer"}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  {s.marks !== null && <Chip size="small" color={s.marks >= item.pass ? "success" : "error"} label={`${s.marks}/${item.max} ${s.marks >= item.pass ? "Pass" : "Fail"}`} />}
                  <Button size="small" variant="outlined" disabled={!s.answered} onClick={() => setGrading(s.submissionId)}>
                    {readOnly ? "View" : s.marks === null ? "Open and grade" : "Open"}
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Button component={Link} href="/teacher/tests" sx={{ alignSelf: "flex-start" }}>Back to tests</Button>

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
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={readOnly || grade.isPending || invalid}
          onClick={() => grade.mutate({ submissionId, marksObtained: value, remark }, { onSuccess: onClose })}
        >
          {grade.isPending ? "Saving…" : "Save grade"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
