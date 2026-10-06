"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client-api";
import type { EnrollStudentInput } from "./types";

export type StudentRow = {
  id: string;
  name: string;
  phoneNumber: string;
  schoolId: string;
  status: "ACTIVE" | "INACTIVE";
  enrollmentId: string | null;
  className: string | null;
  enrollmentStatus: string | null;
};

export type StudentDetail = {
  id: string;
  name: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE";
  schoolId: string;
  enrollments: { id: string; status: string; className: string; sessionLabel: string; sessionStatus: string }[];
};

export function useStudents() {
  return useQuery({ queryKey: ["principal", "students"], queryFn: () => apiRequest<StudentRow[]>("/api/students") });
}

export function useStudent(id: string) {
  return useQuery({ queryKey: ["principal", "students", id], queryFn: () => apiRequest<StudentDetail>(`/api/students/${id}`) });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EnrollStudentInput) =>
      apiRequest<{ studentId: string; schoolId: string; temporaryPassword: string }>("/api/students", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["principal", "students"] }),
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; phoneNumber?: string }) => apiRequest(`/api/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["principal", "students"] }),
  });
}

export function useWithdrawEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => apiRequest(`/api/enrollments/${enrollmentId}/withdraw`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["principal", "students"] }),
  });
}
