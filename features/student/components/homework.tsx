"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useHomework, useHomeworkList, useSubmitHomework } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { FileLinks, FileStagingGrid, useFileStaging } from "./files";

export function HomeworkList() {
  const homework = useHomeworkList();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Homework</Typography>
      <Typography color="text.secondary">Deadlines are a guide. You can still submit after the due date.</Typography>
      {homework.isPending && <Skeleton variant="rounded" height={160} />}
      {homework.isError && <Alert severity="error">{homework.error.message}</Alert>}
      {homework.data?.length === 0 && <Alert severity="info">No homework has been set for your class yet.</Alert>}
      {homework.data && homework.data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {homework.data.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{item.title}</TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{formatDate(item.deadlineDate)}</TableCell>
                  <TableCell>
                    {item.submission
                      ? <Chip size="small" color={item.submission.late ? "warning" : "success"} label={item.submission.late ? "Submitted late" : "Submitted"} />
                      : <Chip size="small" color="warning" label="Pending" />}
                  </TableCell>
                  <TableCell><Button component={Link} href={`/student/homework/${item.id}`} size="small" variant="outlined">Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export function HomeworkDetail({ id }: { id: string }) {
  const homework = useHomework(id);
  const submit = useSubmitHomework(id);
  const staging = useFileStaging(homework.data?.submission?.files ?? [], "HOMEWORK_SUBMISSION");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (homework.isPending) return <Skeleton variant="rounded" height={320} />;
  if (homework.isError) return <Alert severity="error">{homework.error.message}</Alert>;

  const item = homework.data;
  const showForm = editing || !item.submission;

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
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.title}</Typography>
        <Typography color="text.secondary">{item.subject} · due {formatDate(item.deadlineDate)}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h3">Instructions</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.description}</Typography>
          <Typography variant="h3" sx={{ mt: 2 }}>Question paper and material</Typography>
          {item.materials.length === 0
            ? <Typography color="text.secondary">Nothing attached.</Typography>
            : <FileLinks files={item.materials} />}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Your work</Typography>
            {item.submission && !editing && <Button size="small" onClick={() => setEditing(true)}>Edit</Button>}
          </Stack>
          {item.submission && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Last submitted {formatDateTime(item.submission.submittedAt)}
              {item.submission.late ? " (after the due date)" : ""}
            </Typography>
          )}
          {showForm ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {(error || submit.isError) && <Alert severity="error">{error || submit.error?.message}</Alert>}
              <FileStagingGrid staging={staging} label="Attach file" />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={submit.isPending || staging.busy} onClick={handleSubmit}>
                  {submit.isPending || staging.busy ? "Submitting…" : item.submission ? "Save changes" : "Submit"}
                </Button>
                {item.submission && <Button variant="outlined" disabled={submit.isPending || staging.busy} onClick={cancelEdit}>Cancel</Button>}
              </Stack>
            </Stack>
          ) : (
            <Stack sx={{ mt: 2 }}>
              <FileLinks files={item.submission!.files} />
            </Stack>
          )}
        </CardContent>
      </Card>

      {item.submission?.remark && (
        <Card>
          <CardContent>
            <Typography variant="h3">Teacher remark</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.submission.remark}</Typography>
          </CardContent>
        </Card>
      )}

      <Button component={Link} href="/student/homework" variant="outlined" sx={{ alignSelf: "flex-start" }}>Back to homework</Button>
    </Stack>
  );
}
