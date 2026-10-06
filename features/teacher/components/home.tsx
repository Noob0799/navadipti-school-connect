"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { useTeacherPending } from "../queries";

export function TeacherHome() {
  const pending = useTeacherPending();

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Your pending work</Typography>
        <Typography color="text.secondary">Homework to review and tests to grade in this session.</Typography>
      </Stack>
      {pending.isPending && <Skeleton variant="rounded" height={200} />}
      {pending.isError && <Alert severity="error">{pending.error.message}</Alert>}

      {pending.data && (
        <>
          <Stack spacing={1.5}>
            <Typography variant="h3">Homework to review</Typography>
            {pending.data.homework.length === 0 && <Typography color="text.secondary">All homework is reviewed.</Typography>}
            {pending.data.homework.map((h) => (
              <Card key={h.id}>
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Stack>
                    <Typography sx={{ fontWeight: 700 }}>{h.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{h.className} · {h.subject}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Chip size="small" color="warning" label={`${h.pending} to remark`} />
                    <Button component={Link} href={`/teacher/homework/${h.id}`} size="small" variant="outlined">Open</Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h3">Syllabus to publish</Typography>
            {pending.data.syllabus.length === 0 && <Typography color="text.secondary">You have no classes this session.</Typography>}
            {pending.data.syllabus.map((s) => (
              <Card key={s.offeringSubjectId}>
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700 }}>{s.className} · {s.subject}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Chip size="small" color={s.pending ? "warning" : "success"} label={s.pending ? `${s.pending} term${s.pending === 1 ? "" : "s"} to publish` : "All published"} />
                    <Button component={Link} href="/teacher/syllabus" size="small" variant="outlined">Open</Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h3">Tests to grade</Typography>
            {pending.data.tests.length === 0 && <Typography color="text.secondary">Nothing to grade.</Typography>}
            {pending.data.tests.map((t) => (
              <Card key={t.id}>
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Stack>
                    <Typography sx={{ fontWeight: 700 }}>{t.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{t.className} · {t.subject} · {t.termLabel}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Chip size="small" color="warning" label={`${t.pending} to grade`} />
                    <Button component={Link} href={`/teacher/tests/${t.id}`} size="small" variant="outlined">Open</Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
