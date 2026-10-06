"use client";

import { Alert, Card, CardContent, Chip, MenuItem, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useAssignTeacher, useClassOfferings, useTeachers } from "../queries";

export function ClassAssignments() {
  const classes = useClassOfferings();
  const teachers = useTeachers();
  const assign = useAssignTeacher();

  if (classes.isPending || teachers.isPending) return <Skeleton variant="rounded" height={320} />;
  if (classes.isError) return <Alert severity="error">{classes.error.message}</Alert>;
  if (teachers.isError) return <Alert severity="error">{teachers.error.message}</Alert>;

  const { session, classes: offerings } = classes.data;
  if (!session) {
    return <Alert severity="info">There is no active session yet. Activate a session to assign teachers.</Alert>;
  }

  const activeTeachers = teachers.data.filter((t) => t.status === "ACTIVE");

  return (
    <Stack spacing={3}>
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Class assignments</Typography>
        <Chip size="small" label={`Session ${session.label}`} />
      </Stack>
      <Typography color="text.secondary">
        Pick one teacher per subject. Only teachers with that subject in their expertise appear in the list.
      </Typography>
      {assign.isError && <Alert severity="error">{assign.error.message}</Alert>}

      {offerings.map((offering) => (
        <Card key={offering.id}>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>{offering.name}</Typography>
            <Stack spacing={2}>
              {offering.subjects.map((subject) => {
                const experts = activeTeachers.filter((t) => t.subjects.some((s) => s.id === subject.subjectId));
                const assignedId = subject.teacher?.id ?? "";
                return (
                  <TextField
                    key={subject.offeringSubjectId}
                    select
                    size="small"
                    label={subject.subjectName}
                    value={assignedId}
                    disabled={assign.isPending}
                    helperText={experts.length === 0 ? "No active teacher is an expert in this subject yet." : undefined}
                    onChange={(event) =>
                      assign.mutate({
                        offeringSubjectId: subject.offeringSubjectId,
                        teacherId: event.target.value || null,
                      })
                    }
                  >
                    <MenuItem value="">Not assigned</MenuItem>
                    {experts.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>{teacher.name}</MenuItem>
                    ))}
                    {subject.teacher && !experts.some((t) => t.id === subject.teacher?.id) && (
                      <MenuItem value={subject.teacher.id} disabled>{subject.teacher.name} (no longer an expert)</MenuItem>
                    )}
                  </TextField>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
