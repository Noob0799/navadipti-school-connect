"use client";

import { useState } from "react";
import { Alert, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, FormGroup, Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
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
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingExpertise, setEditingExpertise] = useState(false);


  if (teacher.isPending) return <Skeleton variant="rounded" height={320} />;
  if (teacher.isError) return <Alert severity="error">{teacher.error.message}</Alert>;

  const data = teacher.data;
  const current = selected ?? data.subjects.map((s) => s.id);
  const activeAssignments = data.assignments.filter((a) => a.sessionStatus === "ACTIVE");
  const classGroups: { className: string; subjectNames: string[] }[] = [];
  for (const a of activeAssignments) {
    const group = classGroups.find((g) => g.className === a.className);
    if (group) group.subjectNames.push(a.subjectName);
    else classGroups.push({ className: a.className, subjectNames: [a.subjectName] });
  }

  return (
    <Stack spacing={3}>
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>{data.name}</Typography>
        <Chip size="small" label={data.status === "ACTIVE" ? "Active" : "Inactive"} color={data.status === "ACTIVE" ? "success" : "default"} />
      </Stack>

      {savedNote && <Alert severity="success" onClose={() => setSavedNote(null)}>{savedNote}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: editingDetails ? 2 : 1 }}>
                  <Typography variant="h3">Details</Typography>
                  {!editingDetails && <Button size="small" onClick={() => setEditingDetails(true)}>Edit</Button>}
                </Stack>
                {editingDetails ? (
                  <TeacherForm
                    key={data.id + data.name + data.phoneNumber + data.employeeInfo}
                    defaultValues={{ name: data.name, phoneNumber: data.phoneNumber, employeeInfo: data.employeeInfo }}
                    submitLabel="Save details"
                    pending={updateTeacher.isPending}
                    error={updateTeacher.error?.message ?? null}
                    onCancel={() => setEditingDetails(false)}
                    onSubmit={(values) =>
                      updateTeacher.mutate(values, { onSuccess: () => { setSavedNote("Details saved."); setEditingDetails(false); } })
                    }
                  />
                ) : (
                  <Stack spacing={1.5}>
                    <Stack>
                      <Typography variant="caption" color="text.secondary">Full name</Typography>
                      <Typography>{data.name}</Typography>
                    </Stack>
                    <Stack>
                      <Typography variant="caption" color="text.secondary">Phone number</Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono)" }}>{data.phoneNumber}</Typography>
                    </Stack>
                    <Stack>
                      <Typography variant="caption" color="text.secondary">Employee details</Typography>
                      <Typography color={data.employeeInfo ? "text.primary" : "text.secondary"}>{data.employeeInfo || "Not set."}</Typography>
                    </Stack>
                  </Stack>
                )}
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>Subject expertise</Typography>
                  {!editingExpertise && <Button size="small" onClick={() => setEditingExpertise(true)}>Edit</Button>}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Teachers can only be assigned to subjects they are expert in.
                </Typography>
                {expertiseError && <Alert severity="error" sx={{ mb: 2 }}>{expertiseError}</Alert>}
                {editingExpertise ? (
                  <>
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
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        disabled={setExpertise.isPending}
                        onClick={() => {
                          setExpertiseError(null);
                          setExpertise.mutate(
                            { subjectIds: current },
                            {
                              onSuccess: () => { setSavedNote("Expertise saved."); setEditingExpertise(false); },
                              onError: (error) => setExpertiseError(error.message),
                            },
                          );
                        }}
                      >
                        Save expertise
                      </Button>
                      <Button variant="outlined" disabled={setExpertise.isPending} onClick={() => { setSelected(null); setExpertiseError(null); setEditingExpertise(false); }}>
                        Cancel
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {data.subjects.length === 0 && <Typography color="text.secondary">No subjects yet.</Typography>}
                    {data.subjects.map((subject) => <Chip key={subject.id} size="small" label={subject.name} />)}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h3">Classes this session</Typography>
                {activeAssignments.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{activeAssignments[0].sessionLabel}</Typography>
                )}
                {classGroups.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>Not assigned to any class yet.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Class</TableCell>
                        <TableCell>Subjects</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classGroups.map((g) => (
                        <TableRow key={g.className}>
                          <TableCell sx={{ fontWeight: 700 }}>{g.className}</TableCell>
                          <TableCell>
                            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                              {g.subjectNames.map((name) => <Chip key={name} size="small" label={name} />)}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
