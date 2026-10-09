"use client";

import Link from "next/link";
import { Alert, Button, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
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
            {pending.data.homework.length === 0 ? (
              <Typography color="text.secondary">All homework is reviewed.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>To remark</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.data.homework.map((h) => (
                      <TableRow key={h.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{h.title}</TableCell>
                        <TableCell>{h.className}</TableCell>
                        <TableCell>{h.subject}</TableCell>
                        <TableCell><Chip size="small" color="warning" label={`${h.pending} to remark`} /></TableCell>
                        <TableCell><Button component={Link} href={`/teacher/homework/${h.id}`} size="small" variant="outlined">Open</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h3">Syllabus to publish</Typography>
            {pending.data.syllabus.length === 0 ? (
              <Typography color="text.secondary">You have no classes this session.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.data.syllabus.map((s) => (
                      <TableRow key={s.offeringSubjectId} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{s.className}</TableCell>
                        <TableCell>{s.subject}</TableCell>
                        <TableCell>
                          <Chip size="small" color={s.pending ? "warning" : "success"} label={s.pending ? `${s.pending} term${s.pending === 1 ? "" : "s"} to publish` : "All published"} />
                        </TableCell>
                        <TableCell><Button component={Link} href="/teacher/syllabus" size="small" variant="outlined">Open</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h3">Tests to grade</Typography>
            {pending.data.tests.length === 0 ? (
              <Typography color="text.secondary">Nothing to grade.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>To grade</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.data.tests.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t.className}</TableCell>
                        <TableCell>{t.subject}</TableCell>
                        <TableCell>{t.termLabel}</TableCell>
                        <TableCell><Chip size="small" color="warning" label={`${t.pending} to grade`} /></TableCell>
                        <TableCell><Button component={Link} href={`/teacher/tests/${t.id}`} size="small" variant="outlined">Open</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}
