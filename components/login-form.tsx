"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import type { Role } from "@prisma/client";
import { HOME_PATH } from "@/lib/roles";

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(1, "Enter your phone number"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: "", password: "" },
  });

  const login = useMutation({
    mutationFn: async (values: LoginValues) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not sign in.");
      return body as { role: Role };
    },
    onSuccess: ({ role }) => router.replace(HOME_PATH[role]),
  });

  return (
    <Box component="form" noValidate onSubmit={form.handleSubmit((values) => login.mutate(values))}>
      <Stack spacing={2.5}>
        {login.error && <Alert severity="error">{login.error.message}</Alert>}
        <TextField
          label="Phone number"
          inputMode="numeric"
          autoComplete="username"
          error={!!form.formState.errors.phoneNumber}
          helperText={form.formState.errors.phoneNumber?.message}
          {...form.register("phoneNumber")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" variant="contained" size="large" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
    </Box>
  );
}
