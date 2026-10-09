"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTest, useTestList, useSubmitTest } from "../queries";
import { formatDate } from "@/lib/format";
import { FileLinks, FilePreview, FileStagingGrid, useFileStaging } from "./files";

export function TestList() {
  const tests = useTestList();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Tests</Typography>
      {tests.isPending && <Skeleton variant="rounded" height={160} />}
      {tests.isError && <Alert severity="error">{tests.error.message}</Alert>}
      {tests.data?.length === 0 && <Alert severity="info">No tests have been set for your class yet.</Alert>}
      {tests.data && tests.data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Out of</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.data.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{test.subject}</TableCell>
                  <TableCell>{test.termLabel}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{test.max}</TableCell>
                  <TableCell>{formatDate(test.deadlineDate)}</TableCell>
                  <TableCell>
                    {test.submission
                      ? <Chip size="small" color="success" label="Answer uploaded" />
                      : <Chip size="small" color="warning" label="Not submitted" />}
                  </TableCell>
                  <TableCell><Button component={Link} href={`/student/tests/${test.id}`} size="small" variant="outlined">Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export function TestDetail({ id }: { id: string }) {
  const test = useTest(id);
  const submit = useSubmitTest(id);
  const staging = useFileStaging(test.data?.submission?.files ?? [], "TEST_SUBMISSION");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (test.isPending) return <Skeleton variant="rounded" height={320} />;
  if (test.isError) return <Alert severity="error">{test.error.message}</Alert>;

  const item = test.data;
  const deadlinePassed = new Date() > new Date(item.deadlineDate);
  const showForm = !deadlinePassed && (editing || !item.submission);

  function cancelEdit() {
    staging.discard();
    setError(null);
    setEditing(false);
  }

  async function handleSubmit() {
    setError(null);
    if (staging.visibleFiles.length + staging.pendingFiles.length === 0) return setError("Attach at least one file before submitting.");
    try {
      const { submissionId } = await submit.mutateAsync();
      await staging.commit(submissionId);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.subject} · {item.termLabel}</Typography>
        <Typography color="text.secondary">out of {item.max} · pass mark {item.pass} · due {formatDate(item.deadlineDate)}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h3">Question paper</Typography>
          {item.paper.length === 0
            ? <Typography color="text.secondary">Your teacher has not attached the paper yet.</Typography>
            : (
              <Stack spacing={2}>
                <FileLinks files={item.paper} />
                <FilePreview file={item.paper[0]} />
              </Stack>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Your answer</Typography>
            {item.submission && !editing && !deadlinePassed && <Button size="small" onClick={() => setEditing(true)}>Edit</Button>}
          </Stack>
          {deadlinePassed && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>The deadline has passed. You can no longer submit or change your answer.</Typography>}
          {showForm ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {(error || submit.isError) && <Alert severity="error">{error || submit.error?.message}</Alert>}
              <FileStagingGrid staging={staging} label="Attach answer" />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={submit.isPending || staging.busy} onClick={handleSubmit}>
                  {submit.isPending || staging.busy ? "Submitting…" : item.submission ? "Save changes" : "Submit answer"}
                </Button>
                {item.submission && <Button variant="outlined" disabled={submit.isPending || staging.busy} onClick={cancelEdit}>Cancel</Button>}
              </Stack>
            </Stack>
          ) : item.submission ? (
            <Stack sx={{ mt: 2 }}>
              <FileLinks files={item.submission.files} />
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No answer was submitted.</Typography>
          )}
        </CardContent>
      </Card>

      {item.submission?.graded && (
        <Card>
          <CardContent>
            <Typography variant="h3">Result</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography>{item.submission.marks} / {item.max}</Typography>
              <Chip size="small" color={(item.submission.marks ?? 0) >= item.pass ? "success" : "error"} label={(item.submission.marks ?? 0) >= item.pass ? "Pass" : "Fail"} />
            </Stack>
            {item.submission.remark && <Typography sx={{ mt: 1 }}>Remark: {item.submission.remark}</Typography>}
          </CardContent>
        </Card>
      )}

      <Button component={Link} href="/student/tests" variant="outlined" sx={{ alignSelf: "flex-start" }}>Back to tests</Button>
    </Stack>
  );
}
