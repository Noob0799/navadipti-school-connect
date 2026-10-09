"use client";

import Link from "next/link";
import { Alert, Button, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatDate } from "@/lib/format";
import { usePending } from "../queries";

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
          <Stack spacing={1.5}>
            <Typography variant="h3">Homework</Typography>
            {pending.data.homework.length === 0 ? (
              <Typography color="text.secondary">All homework submitted.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.data.homework.map((h) => (
                      <TableRow key={h.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{h.title}</TableCell>
                        <TableCell>{h.subject}</TableCell>
                        <TableCell>{formatDate(h.deadlineDate)}</TableCell>
                        <TableCell><Button component={Link} href={`/student/homework/${h.id}`} size="small" variant="outlined">Open</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h3">Tests</Typography>
            {pending.data.tests.length === 0 ? (
              <Typography color="text.secondary">No pending tests.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ "& th": { whiteSpace: "nowrap" } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Out of</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.data.tests.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t.subject}</TableCell>
                        <TableCell>{t.termLabel}</TableCell>
                        <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{t.max}</TableCell>
                        <TableCell>{formatDate(t.deadlineDate)}</TableCell>
                        <TableCell><Button component={Link} href={`/student/tests/${t.id}`} size="small" variant="outlined">Open</Button></TableCell>
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
