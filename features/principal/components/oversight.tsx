"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, CardContent, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { apiRequest } from "@/lib/client-api";
import type { TeacherHomeworkRow, TeacherTestRow, TeacherSyllabus } from "@/features/teacher/queries";
import { formatDate } from "@/lib/format";
import { SyllabusTable } from "@/components/syllabus-table";

function Loading() {
  return <Skeleton variant="rounded" height={200} />;
}

export function OversightHomeworkList() {
  const list = useQuery({ queryKey: ["principal", "oversight", "homework"], queryFn: () => apiRequest<TeacherHomeworkRow[]>("/api/homework") });
  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Homework</Typography>
      <Typography color="text.secondary">Read-only view of every class this session. Teachers manage their own work.</Typography>
      {list.isPending && <Loading />}
      {list.isError && <Alert severity="error">{list.error.message}</Alert>}
      {list.data?.length === 0 && <Alert severity="info">No homework has been set this session.</Alert>}
      {list.data && list.data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>To remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.className}</TableCell>
                  <TableCell>{h.subject}</TableCell>
                  <TableCell>
                    <Link href={`/principal/homework/${h.id}`} style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>{h.title}</Link>
                  </TableCell>
                  <TableCell>{h.teacherName}</TableCell>
                  <TableCell>{formatDate(h.deadlineDate)}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{h.submittedCount}/{h.expectedCount}</TableCell>
                  <TableCell>
                    {h.submittedCount === 0
                      ? <Typography variant="body2" color="text.secondary">N/A</Typography>
                      : <Chip size="small" color={h.pendingRemarkCount ? "warning" : "success"} label={h.pendingRemarkCount} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export function OversightTestList() {
  const list = useQuery({ queryKey: ["principal", "oversight", "tests"], queryFn: () => apiRequest<TeacherTestRow[]>("/api/tests") });
  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Tests</Typography>
      <Typography color="text.secondary">Read-only view of every test this session, with grading progress.</Typography>
      {list.isPending && <Loading />}
      {list.isError && <Alert severity="error">{list.error.message}</Alert>}
      {list.data?.length === 0 && <Alert severity="info">No tests have been set this session.</Alert>}
      {list.data && list.data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Answered</TableCell>
                <TableCell>To grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.className}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.termLabel}</TableCell>
                  <TableCell>
                    <Link href={`/principal/tests/${t.id}`} style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>{t.title}</Link>
                  </TableCell>
                  <TableCell>{t.teacherName}</TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{t.answeredCount}/{t.expectedCount}</TableCell>
                  <TableCell>
                    {t.answeredCount === 0
                      ? <Typography variant="body2" color="text.secondary">N/A</Typography>
                      : <Chip size="small" color={t.ungradedCount ? "warning" : "success"} label={t.ungradedCount} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export function OversightSyllabus() {
  const syllabus = useQuery({ queryKey: ["principal", "oversight", "syllabus"], queryFn: () => apiRequest<TeacherSyllabus[]>("/api/syllabus") });
  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Syllabus</Typography>
      <Typography color="text.secondary">Read-only view of the syllabus for every class and term.</Typography>
      {syllabus.isPending && <Loading />}
      {syllabus.isError && <Alert severity="error">{syllabus.error.message}</Alert>}
      {syllabus.data?.map((row) => (
        <Card key={row.offeringSubjectId}>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>{row.className} · {row.subject}</Typography>
            <SyllabusTable rows={row.terms.map((term) => ({ termLabel: term.termLabel, content: term.exists ? term.content : null, files: term.files }))} />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
