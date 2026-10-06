"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useCreateTeacher } from "../queries";
import { TeacherForm } from "./teacher-form";

export function TeacherCreate() {
  const createTeacher = useCreateTeacher();

  if (createTeacher.isSuccess) {
    const { teacher, temporaryPassword } = createTeacher.data;
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">{teacher.name} has been added</Typography>
            <Alert severity="warning">
              Share this temporary password now. It will not be shown again.
            </Alert>
            <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: "0.04em" }}>
              {temporaryPassword}
            </Typography>
            <Button component={Link} href={`/principal/teachers/${teacher.id}`} variant="contained" sx={{ alignSelf: "flex-start" }}>
              Open teacher profile
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <TeacherForm
          submitLabel="Add teacher"
          pending={createTeacher.isPending}
          error={createTeacher.error?.message ?? null}
          onSubmit={(values) => createTeacher.mutate(values)}
        />
      </CardContent>
    </Card>
  );
}
