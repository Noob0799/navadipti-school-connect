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
    syllabusToPublish: number;
    rows: { className: string; subject: string; homeworkToRemark: number; testsToGrade: number; syllabusToPublish: number }[];
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
  const totalPending = data.teachers.reduce((n, t) => n + t.homeworkToRemark + t.testsToGrade + t.syllabusToPublish, 0);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Dashboard</Typography>
        <Typography color="text.secondary">Pending work across all teachers in the active session.</Typography>
        <Stack direction="row" spacing={1} sx={{ pt: 1, flexWrap: "wrap" }}>
          <Button component={Link} href="/principal/students/new" variant="outlined" size="small">Enrol student</Button>
          <Button component={Link} href="/principal/teachers/new" variant="outlined" size="small">Add teacher</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active session</Typography>
              <Typography variant="h2" sx={{ fontSize: 28, fontFamily: "var(--font-mono)" }}>{data.activeSession ?? "None"}</Typography>
              <Button component={Link} href="/principal/sessions" variant="outlined" size="small" sx={{ mt: 1 }}>Manage sessions</Button>
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
              <Typography variant="body2" color="text.secondary">homework to remark, tests to grade and syllabus to publish</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Class subjects with no teacher</Typography>
              <Typography variant="h2" sx={{ fontSize: 28 }}>{data.unassignedSubjects}</Typography>
              <Button component={Link} href="/principal/classes" variant="outlined" size="small" sx={{ mt: 1 }}>Assign teachers</Button>
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
                    <Link href={`/principal/teachers/${teacher.id}`} style={{ color: "inherit", textDecoration: "none" }}>{teacher.name}</Link>
                  </Typography>
                  {!teacher.active && <Chip size="small" label="Inactive" />}
                </Stack>
                {teacher.rows.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip size="small" color={teacher.homeworkToRemark ? "warning" : "success"} label={`${teacher.homeworkToRemark} homework to remark`} />
                    <Chip size="small" color={teacher.testsToGrade ? "warning" : "success"} label={`${teacher.testsToGrade} tests to grade`} />
                    <Chip size="small" color={teacher.syllabusToPublish ? "warning" : "success"} label={`${teacher.syllabusToPublish} syllabus to publish`} />
                  </Stack>
                )}
              </Stack>

              {teacher.rows.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 1 }}>No classes assigned this session.</Typography>
              ) : (
                <Table size="small" sx={{ mt: 1.5, tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Homework to remark</TableCell>
                      <TableCell>Tests to grade</TableCell>
                      <TableCell>Syllabus to publish</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacher.rows.map((row) => (
                      <TableRow key={`${row.className}-${row.subject}`}>
                        <TableCell>{row.className}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{row.homeworkToRemark}</TableCell>
                        <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{row.testsToGrade}</TableCell>
                        <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{row.syllabusToPublish}</TableCell>
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
