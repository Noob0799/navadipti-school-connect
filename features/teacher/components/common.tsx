"use client";

import { useState } from "react";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks, FilePreview } from "@/features/student/components/files";
import { useTeacherDeleteFile, useTeacherUpload } from "../queries";

export function TeacherUpload({ ownerType, ownerId, label }: { ownerType: "HOMEWORK" | "TEST" | "SYLLABUS"; ownerId: string; label: string }) {
  const upload = useTeacherUpload();
  const [error, setError] = useState<string | null>(null);

  async function onChange(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      await upload.mutateAsync({ ownerType, ownerId, file });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    }
  }

  return (
    <Stack spacing={1}>
      {error && <Alert severity="error">{error}</Alert>}
      <Button component="label" variant="outlined" size="small" disabled={upload.isPending} sx={{ alignSelf: "flex-start" }} startIcon={upload.isPending ? <CircularProgress size={14} /> : undefined}>
        {upload.isPending ? "Uploading…" : label}
        <input hidden type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => onChange(e.target.files?.[0])} />
      </Button>
    </Stack>
  );
}

export function EditableFiles({ files }: { files: FileRef[] }) {
  const remove = useTeacherDeleteFile();
  if (files.length === 0) return <Typography color="text.secondary">No files attached.</Typography>;
  return (
    <Stack spacing={1}>
      {files.map((file) => (
        <Stack key={file.id} direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" href={`/api/attachments/${file.id}`} target="_blank" rel="noreferrer">{file.name}</Button>
          <Button size="small" variant="outlined" color="error" disabled={remove.isPending} onClick={() => remove.mutate(file.id)}>Remove</Button>
        </Stack>
      ))}
    </Stack>
  );
}

export function FilesPreviewList({ files }: { files: FileRef[] }) {
  if (files.length === 0) return <Typography color="text.secondary">Nothing uploaded.</Typography>;
  return (
    <Stack spacing={2}>
      <FileLinks files={files} />
      <FilePreview file={files[0]} />
    </Stack>
  );
}

