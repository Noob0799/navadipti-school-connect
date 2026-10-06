"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { usePending } from "../queries";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function StudentHome() {
  const pending = usePending();

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Your pending work</Typography>
        <Typography color="text.secondary">Things you still need to submit for your class.</Typography>
      </Stack>

      {pending.isPending && <Skeleton variant="rounded" height={200} />}
      {pending.isError && <Alert severity="error">{pending.error.message}</Alert>}

      {pending.data && (
        <>
          <Section title="Homework">
            {pending.data.homework.length === 0
              ? <Typography color="text.secondary">All homework submitted.</Typography>
              : pending.data.homework.map((h) => (
                  <Item key={h.id} href={`/student/homework/${h.id}`} title={h.title} meta={`${h.subject} · due ${formatDate(h.deadlineDate)}`} />
                ))}
          </Section>
          <Section title="Tests">
            {pending.data.tests.length === 0
              ? <Typography color="text.secondary">No pending tests.</Typography>
              : pending.data.tests.map((t) => (
                  <Item key={t.id} href={`/student/tests/${t.id}`} title={t.title} meta={`${t.subject} · ${t.termLabel} · out of ${t.max} · due ${formatDate(t.deadlineDate)}`} />
                ))}
          </Section>
        </>
      )}
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="h3">{title}</Typography>
      {children}
    </Stack>
  );
}

function Item({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Stack>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{meta}</Typography>
        </Stack>
        <Button component={Link} href={href} variant="outlined" size="small">Open</Button>
      </CardContent>
    </Card>
  );
}
