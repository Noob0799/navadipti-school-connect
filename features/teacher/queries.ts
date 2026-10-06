"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client-api";
import type { FileRef } from "@/features/student/queries";

export type Assignment = { offeringSubjectId: string; subjectName: string; className: string };

export type TeacherHomeworkRow = {
  id: string;
  title: string;
  teacherName: string;
  deadlineDate: string;
  subject: string;
  className: string;
  submittedCount: number;
  pendingRemarkCount: number;
};

export type TeacherHomework = {
  id: string;
  title: string;
  description: string;
  deadlineDate: string;
  subject: string;
  className: string;
  offeringSubjectId: string;
  materials: FileRef[];
  submissions: {
    studentId: string;
    name: string;
    schoolId: string;
    submissionId: string | null;
    submitted: boolean;
    submittedAt: string | null;
    late: boolean;
    remark: string;
    files: FileRef[];
  }[];
};

export type TeacherTestRow = {
  id: string;
  title: string;
  teacherName: string;
  deadlineDate: string;
  termName: string;
  termLabel: string;
  max: number;
  subject: string;
  className: string;
  answeredCount: number;
  ungradedCount: number;
};

export type TeacherTest = {
  id: string;
  title: string;
  deadlineDate: string;
  termName: string;
  termLabel: string;
  max: number;
  pass: number;
  subject: string;
  className: string;
  paper: FileRef[];
  students: {
    studentId: string;
    name: string;
    schoolId: string;
    submissionId: string | null;
    answered: boolean;
    files: FileRef[];
    marks: number | null;
    remark: string;
  }[];
};

export type TeacherSyllabus = {
  offeringSubjectId: string;
  subject: string;
  className: string;
  terms: { termName: string; termLabel: string; syllabusId: string | null; content: string; exists: boolean; files: FileRef[] }[];
};

export function useAssignments() {
  return useQuery({ queryKey: ["teacher", "assignments"], queryFn: () => apiRequest<Assignment[]>("/api/teacher/assignments"), staleTime: 60_000 });
}

export function useTeacherPending() {
  return useQuery({
    queryKey: ["teacher", "pending"],
    queryFn: () =>
      apiRequest<{
        homework: { id: string; title: string; subject: string; className: string; pending: number }[];
        tests: { id: string; title: string; subject: string; className: string; termLabel: string; pending: number }[];
      }>("/api/dashboard/teacher/pending"),
  });
}

export function useTeacherHomeworkList() {
  return useQuery({ queryKey: ["teacher", "homework"], queryFn: () => apiRequest<TeacherHomeworkRow[]>("/api/homework") });
}

export function useTeacherHomework(id: string) {
  return useQuery({ queryKey: ["teacher", "homework", id], queryFn: () => apiRequest<TeacherHomework>(`/api/homework/${id}`) });
}

function invalidateTeacher(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ["teacher"] });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offeringSubjectId, ...body }: { offeringSubjectId: string; title: string; description: string; deadlineDate: string }) =>
      apiRequest<{ id: string }>(`/api/offering-subjects/${offeringSubjectId}/homework`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useUpdateHomework(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title?: string; description?: string; deadlineDate?: string }) =>
      apiRequest(`/api/homework/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useSaveRemark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, remark }: { submissionId: string; remark: string }) =>
      apiRequest(`/api/homework-submissions/${submissionId}/remark`, { method: "PATCH", body: JSON.stringify({ remark }) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useTeacherTestList() {
  return useQuery({ queryKey: ["teacher", "tests"], queryFn: () => apiRequest<TeacherTestRow[]>("/api/tests") });
}

export function useTeacherTest(id: string) {
  return useQuery({ queryKey: ["teacher", "tests", id], queryFn: () => apiRequest<TeacherTest>(`/api/tests/${id}`) });
}

export function useSaveTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offeringSubjectId, termName, title, deadlineDate }: { offeringSubjectId: string; termName: string; title: string; deadlineDate: string }) =>
      apiRequest<{ id: string }>(`/api/offering-subjects/${offeringSubjectId}/tests/${termName}`, { method: "PUT", body: JSON.stringify({ title, deadlineDate }) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, marksObtained, remark }: { submissionId: string; marksObtained: number | null; remark: string }) =>
      apiRequest(`/api/test-submissions/${submissionId}/grade`, { method: "PATCH", body: JSON.stringify({ marksObtained, remark }) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useReleaseGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => apiRequest<{ ungraded: number }>(`/api/tests/${testId}/release-grades`, { method: "POST" }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useTeacherSyllabus() {
  return useQuery({ queryKey: ["teacher", "syllabus"], queryFn: () => apiRequest<TeacherSyllabus[]>("/api/teacher/syllabus") });
}

export function useSaveSyllabus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offeringSubjectId, termName, content }: { offeringSubjectId: string; termName: string; content: string }) =>
      apiRequest(`/api/offering-subjects/${offeringSubjectId}/syllabus/${termName}`, { method: "PUT", body: JSON.stringify({ content }) }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useTeacherUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerType, ownerId, file }: { ownerType: "HOMEWORK" | "TEST" | "SYLLABUS"; ownerId: string; file: File }) => {
      const form = new FormData();
      form.append("ownerType", ownerType);
      form.append("ownerId", ownerId);
      form.append("file", file);
      return apiRequest<FileRef>("/api/attachments", { method: "POST", body: form });
    },
    onSuccess: () => invalidateTeacher(queryClient),
  });
}

export function useTeacherDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/attachments/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateTeacher(queryClient),
  });
}
