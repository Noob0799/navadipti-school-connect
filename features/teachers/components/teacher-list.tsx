"use client";

import Link from "next/link";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTeachers } from "../queries";

export function TeacherList() {
  const teachers = useTeachers();

  return (
    <Stack spacing={2.5}>
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Teachers</Typography>
        <Button component={Link} href="/principal/teachers/new" variant="contained">Add teacher</Button>
      </Stack>

      {teachers.isError && <Alert severity="error">{teachers.error.message}</Alert>}
      {teachers.isPending && <Skeleton variant="rounded" height={180} />}

      {teachers.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Expertise</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.data.map((teacher) => (
                <TableRow key={teacher.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Link href={`/principal/teachers/${teacher.id}`} style={{ color: "inherit" }}>{teacher.name}</Link>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{teacher.phoneNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {teacher.subjects.length === 0 && <Typography variant="body2" color="text.secondary">None yet</Typography>}
                      {teacher.subjects.map((s) => <Chip key={s.id} size="small" label={s.name} />)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={teacher.status === "ACTIVE" ? "Active" : "Inactive"}
                      color={teacher.status === "ACTIVE" ? "success" : "default"}
                    />
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
