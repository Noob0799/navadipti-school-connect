"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client-api";

export type FileRef = { id: string; name: string };

export type HomeworkItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  deadlineDate: string;
  materials: FileRef[];
  submission: { id: string; submittedAt: string; late: boolean; remark: string | null; files: FileRef[] } | null;
};

export type TestItem = {
  id: string;
  title: string;
  subject: string;
  termName: string;
  termLabel: string;
  deadlineDate: string;
  max: number;
  pass: number;
  paper: FileRef[];
  submission: { id: string; submittedAt: string; files: FileRef[]; marks: number | null; remark: string | null; graded: boolean } | null;
};

export type SyllabusSubject = {
  subject: string;
  terms: { termName: string; termLabel: string; syllabus: { content: string; updatedAt: string; files: FileRef[] } | null }[];
};

export type ResultSubject = {
  subject: string;
  total: number;
  totalMax: number;
  totalPass: number;
  allGraded: boolean;
  passed: boolean;
  tests: { testId: string; termLabel: string; marks: number | null; max: number; pass: number; remark: string | null }[];
};

export type NotificationItem = { id: string; type: string; message: string; createdAt: string; isNew: boolean };

export function usePending() {
  return useQuery({
    queryKey: ["student", "pending"],
    queryFn: () =>
      apiRequest<{
        homework: { id: string; title: string; subject: string; deadlineDate: string }[];
        tests: { id: string; title: string; subject: string; termLabel: string; deadlineDate: string; max: number }[];
      }>("/api/dashboard/student/pending"),
  });
}

export function useHomeworkList() {
  return useQuery({ queryKey: ["student", "homework"], queryFn: () => apiRequest<HomeworkItem[]>("/api/homework") });
}

export function useHomework(id: string) {
  return useQuery({ queryKey: ["student", "homework", id], queryFn: () => apiRequest<HomeworkItem>(`/api/homework/${id}`) });
}

export function useTestList() {
  return useQuery({ queryKey: ["student", "tests"], queryFn: () => apiRequest<TestItem[]>("/api/tests") });
}

export function useTest(id: string) {
  return useQuery({ queryKey: ["student", "tests", id], queryFn: () => apiRequest<TestItem>(`/api/tests/${id}`) });
}

export function useSyllabus() {
  return useQuery({ queryKey: ["student", "syllabus"], queryFn: () => apiRequest<SyllabusSubject[]>("/api/syllabus") });
}

export function useResults() {
  return useQuery({ queryKey: ["student", "results"], queryFn: () => apiRequest<ResultSubject[]>("/api/results") });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["student", "notifications"],
    queryFn: () => apiRequest<{ unreadCount: number; items: NotificationItem[] }>("/api/notifications"),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("/api/notifications/mark-read", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "notifications"] }),
  });
}

export function useSubmitHomework(homeworkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ submissionId: string }>(`/api/homework/${homeworkId}/submissions`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "homework"] });
      queryClient.invalidateQueries({ queryKey: ["student", "pending"] });
    },
  });
}

export function useSubmitTest(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<{ submissionId: string }>(`/api/tests/${testId}/submissions`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "tests"] });
      queryClient.invalidateQueries({ queryKey: ["student", "pending"] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerType, ownerId, file }: { ownerType: "HOMEWORK_SUBMISSION" | "TEST_SUBMISSION"; ownerId: string; file: File }) => {
      const form = new FormData();
      form.append("ownerType", ownerType);
      form.append("ownerId", ownerId);
      form.append("file", file);
      return apiRequest<FileRef>("/api/attachments", { method: "POST", body: form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/attachments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
}
