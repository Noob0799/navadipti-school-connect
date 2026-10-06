"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { teacherInputSchema, type TeacherInput } from "../schemas";

type Props = {
  defaultValues?: Partial<TeacherInput>;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: TeacherInput) => void;
};

export function TeacherForm({ defaultValues, submitLabel, pending, error, onSubmit }: Props) {
  const form = useForm<TeacherInput>({
    resolver: zodResolver(teacherInputSchema),
    defaultValues: { name: "", phoneNumber: "", employeeInfo: "", ...defaultValues },
  });
  const errors = form.formState.errors;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Full name"
          error={!!errors.name}
          helperText={errors.name?.message}
          {...form.register("name")}
        />
        <TextField
          label="Phone number"
          inputMode="numeric"
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber?.message ?? "10 digits. Used to sign in."}
          {...form.register("phoneNumber")}
        />
        <TextField
          label="Employee details (optional)"
          multiline
          minRows={2}
          error={!!errors.employeeInfo}
          helperText={errors.employeeInfo?.message}
          {...form.register("employeeInfo")}
        />
        <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "flex-start" }}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
