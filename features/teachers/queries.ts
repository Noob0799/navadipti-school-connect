"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExpertiseInput, TeacherInput, TeacherUpdate } from "./schemas";

export type TeacherSummary = {
  id: string;
  name: string;
  phoneNumber: string;
  status: "ACTIVE" | "INACTIVE";
  employeeInfo: string;
  subjects: { id: string; name: string }[];
};

export type TeacherDetail = TeacherSummary & {
  assignments: {
    offeringSubjectId: string;
    subjectName: string;
    className: string;
    classOrder: number;
    sessionLabel: string;
    sessionStatus: string;
  }[];
};

export type ClassOfferingsResponse = {
  session: { id: string; label: string } | null;
  classes: {
    id: string;
    name: string;
    subjects: {
      offeringSubjectId: string;
      subjectId: string;
      subjectName: string;
      teacher: { id: string; name: string } | null;
    }[];
  }[];
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Something went wrong. Try again.");
  return body as T;
}

const post = (url: string, body: unknown, method = "POST") =>
  request(url, { method, body: JSON.stringify(body) });

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: () => request<TeacherSummary[]>("/api/teachers"),
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ["teachers", id],
    queryFn: () => request<TeacherDetail>(`/api/teachers/${id}`),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => request<{ id: string; name: string }[]>("/api/subjects"),
    staleTime: Infinity,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeacherInput) =>
      request<{ teacher: TeacherDetail; temporaryPassword: string }>("/api/teachers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeacherUpdate) => post(`/api/teachers/${id}`, input, "PATCH"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useSetTeacherStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => post(`/api/teachers/${id}/status`, { active }, "PATCH"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useSetExpertise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpertiseInput) => post(`/api/teachers/${id}/expertise`, input, "PUT"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useClassOfferings() {
  return useQuery({
    queryKey: ["class-offerings"],
    queryFn: () => request<ClassOfferingsResponse>("/api/class-offerings"),
  });
}

export function useAssignTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offeringSubjectId, teacherId }: { offeringSubjectId: string; teacherId: string | null }) =>
      teacherId
        ? post(`/api/offering-subjects/${offeringSubjectId}/teacher`, { teacherId }, "PUT")
        : request(`/api/offering-subjects/${offeringSubjectId}/teacher`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-offerings"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
