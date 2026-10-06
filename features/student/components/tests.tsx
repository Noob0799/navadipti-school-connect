"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { useTest, useTestList, useSubmitTest } from "../queries";
import { FileLinks, FilePreview, UploadAnswer } from "./files";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function TestList() {
  const tests = useTestList();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Tests</Typography>
      {tests.isPending && <Skeleton variant="rounded" height={160} />}
      {tests.isError && <Alert severity="error">{tests.error.message}</Alert>}
      {tests.data?.length === 0 && <Alert severity="info">No tests have been set for your class yet.</Alert>}
      {tests.data?.map((test) => (
        <Card key={test.id}>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
              <Stack spacing={0.5}>
                <Typography variant="h3" sx={{ mb: 0 }}>
                  <Link href={`/student/tests/${test.id}`} style={{ color: "inherit" }}>{test.title}</Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">{test.subject} · {test.termLabel} · out of {test.max} · due {formatDate(test.deadlineDate)}</Typography>
              </Stack>
              {test.submission
                ? <Chip size="small" color="success" label="Answer uploaded" />
                : <Chip size="small" color="warning" label="Not submitted" />}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function TestDetail({ id }: { id: string }) {
  const test = useTest(id);
  const submit = useSubmitTest(id);

  if (test.isPending) return <Skeleton variant="rounded" height={320} />;
  if (test.isError) return <Alert severity="error">{test.error.message}</Alert>;

  const item = test.data;
  const ensureSubmission = async () => (await submit.mutateAsync()).submissionId;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{item.title}</Typography>
        <Typography color="text.secondary">{item.subject} · {item.termLabel} · out of {item.max} · pass mark {item.pass} · due {formatDate(item.deadlineDate)}</Typography>
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
          <Typography variant="h3">Your answer</Typography>
          {item.submission ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FileLinks files={item.submission.files} removable />
              {item.submission.files.length > 0 && <FilePreview file={item.submission.files[0]} />}
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 1 }}>No answer uploaded yet.</Typography>
          )}
          <Stack sx={{ mt: 2 }} spacing={2}>
            {submit.isError && <Alert severity="error">{submit.error.message}</Alert>}
            <UploadAnswer ownerType="TEST_SUBMISSION" ensureOwner={ensureSubmission} label={item.submission ? "Upload a new version" : "Upload answer"} />
          </Stack>
        </CardContent>
      </Card>

      {item.submission?.graded && (
        <Card>
          <CardContent>
            <Typography variant="h3">Result</Typography>
            <Typography>
              {item.submission.marks} / {item.max}{" "}
              <Chip size="small" sx={{ ml: 1 }} color={(item.submission.marks ?? 0) >= item.pass ? "success" : "error"} label={(item.submission.marks ?? 0) >= item.pass ? "Pass" : "Fail"} />
            </Typography>
            {item.submission.remark && <Typography sx={{ mt: 1 }}>Remark: {item.submission.remark}</Typography>}
          </CardContent>
        </Card>
      )}

      <Button component={Link} href="/student/tests" sx={{ alignSelf: "flex-start" }}>Back to tests</Button>
    </Stack>
  );
}
