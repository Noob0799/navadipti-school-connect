"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { useHomework, useHomeworkList, useSubmitHomework } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { FileLinks, FilePreview, UploadAnswer } from "./files";

export function HomeworkList() {
  const homework = useHomeworkList();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Homework</Typography>
      <Typography color="text.secondary">Deadlines are a guide. You can still submit after the due date.</Typography>
      {homework.isPending && <Skeleton variant="rounded" height={160} />}
      {homework.isError && <Alert severity="error">{homework.error.message}</Alert>}
      {homework.data?.length === 0 && <Alert severity="info">No homework has been set for your class yet.</Alert>}
      {homework.data?.map((item) => (
        <Card key={item.id}>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
              <Stack spacing={0.5}>
                <Typography variant="h3" sx={{ mb: 0 }}>
                  <Link href={`/student/homework/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>{item.title}</Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">{item.subject} · due {formatDate(item.deadlineDate)}</Typography>
              </Stack>
              {item.submission
                ? <Chip size="small" color={item.submission.late ? "warning" : "success"} label={item.submission.late ? "Submitted late" : "Submitted"} />
                : <Chip size="small" color="warning" label="Pending" />}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function HomeworkDetail({ id }: { id: string }) {
  const homework = useHomework(id);
  const submit = useSubmitHomework(id);

  if (homework.isPending) return <Skeleton variant="rounded" height={320} />;
  if (homework.isError) return <Alert severity="error">{homework.error.message}</Alert>;

  const item = homework.data;
  const ensureSubmission = async () => (await submit.mutateAsync()).submissionId;

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
          <Typography variant="h3">Your work</Typography>
          {item.submission ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Last submitted {formatDateTime(item.submission.submittedAt)}
                {item.submission.late ? " (after the due date)" : ""}
              </Typography>
              <FileLinks files={item.submission.files} removable />
              {item.submission.files.length > 0 && <FilePreview file={item.submission.files[0]} />}
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 1 }}>Not submitted yet.</Typography>
          )}
          <Stack sx={{ mt: 2 }} spacing={2}>
            {submit.isError && <Alert severity="error">{submit.error.message}</Alert>}
            <UploadAnswer ownerType="HOMEWORK_SUBMISSION" ensureOwner={ensureSubmission} label={item.submission ? "Upload a new version" : "Upload and submit"} />
          </Stack>
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
