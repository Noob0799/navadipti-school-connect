"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, CardContent, Chip, Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { apiRequest } from "@/lib/client-api";

type TeamOverview = {
  activeSession: string | null;
  upcomingSession: string | null;
  unassignedSubjects: number;
  teachers: {
    id: string;
    name: string;
    active: boolean;
    homeworkToRemark: number;
    testsToGrade: number;
    rows: { className: string; subject: string; homeworkToRemark: number; testsToGrade: number }[];
  }[];
};

function useTeamOverview() {
  return useQuery({ queryKey: ["principal", "team-overview"], queryFn: () => apiRequest<TeamOverview>("/api/dashboard/principal/team-overview") });
}

export function PrincipalDashboard() {
  const overview = useTeamOverview();

  if (overview.isPending) return <Skeleton variant="rounded" height={320} />;
  if (overview.isError) return <Alert severity="error">{overview.error.message}</Alert>;
  const data = overview.data;
  const totalPending = data.teachers.reduce((n, t) => n + t.homeworkToRemark + t.testsToGrade, 0);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Dashboard</Typography>
        <Typography color="text.secondary">Pending work across all teachers in the active session.</Typography>
        <Stack direction="row" spacing={1} sx={{ pt: 1, flexWrap: "wrap" }}>
          <Button component={Link} href="/principal/students" variant="outlined" size="small">Students</Button>
          <Button component={Link} href="/principal/promotion" variant="outlined" size="small">Promotion</Button>
          <Button component={Link} href="/principal/teachers" variant="outlined" size="small">Teachers</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active session</Typography>
              <Typography variant="h2" sx={{ fontSize: 28, fontFamily: "var(--font-mono)" }}>{data.activeSession ?? "None"}</Typography>
              <Button component={Link} href="/principal/sessions" size="small" sx={{ mt: 1, px: 0 }}>Manage sessions</Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Next: {data.upcomingSession ?? "not created"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Work waiting on teachers</Typography>
              <Typography variant="h2" sx={{ fontSize: 28 }}>{totalPending}</Typography>
              <Typography variant="body2" color="text.secondary">homework to remark and tests to grade</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Class subjects with no teacher</Typography>
              <Typography variant="h2" sx={{ fontSize: 28 }}>{data.unassignedSubjects}</Typography>
              <Button component={Link} href="/principal/classes" size="small" sx={{ mt: 1, px: 0 }}>Assign teachers</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {data.activeSession === null && <Alert severity="info">No session is active yet. Activate a session to see pending work.</Alert>}

      <Stack spacing={2}>
        <Typography variant="h3">Teachers</Typography>
        {data.teachers.length === 0 && <Typography color="text.secondary">No teachers yet.</Typography>}
        {data.teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardContent>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="h3" sx={{ mb: 0 }}>
                    <Link href={`/principal/teachers/${teacher.id}`} style={{ color: "inherit" }}>{teacher.name}</Link>
                  </Typography>
                  {!teacher.active && <Chip size="small" label="Inactive" />}
                </Stack>
                {teacher.rows.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" color={teacher.homeworkToRemark ? "warning" : "success"} label={`${teacher.homeworkToRemark} homework to remark`} />
                    <Chip size="small" color={teacher.testsToGrade ? "warning" : "success"} label={`${teacher.testsToGrade} tests to grade`} />
                  </Stack>
                )}
              </Stack>

              {teacher.rows.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 1 }}>No classes assigned this session.</Typography>
              ) : (
                <Table size="small" sx={{ mt: 1.5 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="right">Homework to remark</TableCell>
                      <TableCell align="right">Tests to grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacher.rows.map((row) => (
                      <TableRow key={`${row.className}-${row.subject}`}>
                        <TableCell>{row.className}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: "var(--font-mono)" }}>{row.homeworkToRemark}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: "var(--font-mono)" }}>{row.testsToGrade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
