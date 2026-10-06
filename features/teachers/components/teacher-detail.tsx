"use client";

import { useState } from "react";
import { Alert, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, FormGroup, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { useSetExpertise, useSetTeacherStatus, useSubjects, useTeacher, useUpdateTeacher } from "../queries";
import { TeacherForm } from "./teacher-form";
import { ResetPasswordButton } from "@/features/accounts/components/password";

export function TeacherDetail({ id }: { id: string }) {
  const teacher = useTeacher(id);
  const subjects = useSubjects();
  const updateTeacher = useUpdateTeacher(id);
  const setStatus = useSetTeacherStatus(id);
  const setExpertise = useSetExpertise(id);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [expertiseError, setExpertiseError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);


  if (teacher.isPending) return <Skeleton variant="rounded" height={320} />;
  if (teacher.isError) return <Alert severity="error">{teacher.error.message}</Alert>;

  const data = teacher.data;
  const current = selected ?? data.subjects.map((s) => s.id);
  const activeAssignments = data.assignments.filter((a) => a.sessionStatus === "ACTIVE");

  return (
    <Stack spacing={3}>
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{data.name}</Typography>
        <Chip size="small" label={data.status === "ACTIVE" ? "Active" : "Inactive"} color={data.status === "ACTIVE" ? "success" : "default"} />
      </Stack>

      {savedNote && <Alert severity="success" onClose={() => setSavedNote(null)}>{savedNote}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>Details</Typography>
              <TeacherForm
                key={data.id + data.name + data.phoneNumber + data.employeeInfo}
                defaultValues={{ name: data.name, phoneNumber: data.phoneNumber, employeeInfo: data.employeeInfo }}
                submitLabel="Save details"
                pending={updateTeacher.isPending}
                error={updateTeacher.error?.message ?? null}
                onSubmit={(values) =>
                  updateTeacher.mutate(values, { onSuccess: () => setSavedNote("Details saved.") })
                }
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 1 }}>Subject expertise</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Teachers can only be assigned to subjects they are expert in.
                </Typography>
                {expertiseError && <Alert severity="error" sx={{ mb: 2 }}>{expertiseError}</Alert>}
                <FormGroup sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  {(subjects.data ?? []).map((subject) => (
                    <FormControlLabel
                      key={subject.id}
                      label={subject.name}
                      control={
                        <Checkbox
                          checked={current.includes(subject.id)}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...current, subject.id]
                              : current.filter((s) => s !== subject.id);
                            setSelected(next);
                          }}
                        />
                      }
                    />
                  ))}
                </FormGroup>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={setExpertise.isPending}
                  onClick={() => {
                    setExpertiseError(null);
                    setExpertise.mutate(
                      { subjectIds: current },
                      {
                        onSuccess: () => setSavedNote("Expertise saved."),
                        onError: (error) => setExpertiseError(error.message),
                      },
                    );
                  }}
                >
                  Save expertise
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 1 }}>Classes this session</Typography>
                {data.assignments.length === 0 && <Typography color="text.secondary">Not assigned to any class yet.</Typography>}
                <Stack spacing={0.75}>
                  {data.assignments.map((a) => (
                    <Typography key={a.offeringSubjectId} variant="body2">
                      <b>{a.className}</b> · {a.subjectName} <span style={{ opacity: 0.7 }}>({a.sessionLabel})</span>
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 1 }}>Account</Typography>
                {data.status === "ACTIVE" ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Deactivating blocks sign-in. Past homework, tests and grades stay on record.
                      {activeAssignments.length > 0 && ` This teacher still has ${activeAssignments.length} class(es) in the active session. Reassign them first.`}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Button color="error" variant="outlined" disabled={setStatus.isPending} onClick={() => setStatus.mutate(false, { onSuccess: () => setSavedNote("Teacher deactivated.") })}>
                        Deactivate teacher
                      </Button>
                      <ResetPasswordButton userId={data.id} name={data.name} />
                    </Stack>
                  </>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Button variant="contained" disabled={setStatus.isPending} onClick={() => setStatus.mutate(true, { onSuccess: () => setSavedNote("Teacher reactivated.") })}>
                      Reactivate teacher
                    </Button>
                    <ResetPasswordButton userId={data.id} name={data.name} />
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
