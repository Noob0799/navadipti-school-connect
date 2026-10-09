"use client";

import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { AddFileTile, FileLinks, FilePreview, FileTile, isPdf } from "@/features/student/components/files";
import { useTeacherDeleteFile, useTeacherUpload } from "../queries";

type PendingFile = { file: File; url?: string };
type OwnerType = "HOMEWORK" | "TEST" | "SYLLABUS";

export function useFileStaging(files: FileRef[], ownerType: OwnerType) {
  const upload = useTeacherUpload();
  const remove = useTeacherDeleteFile();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const visibleFiles = files.filter((f) => !removedIds.has(f.id));
  const dirty = removedIds.size > 0 || pendingFiles.length > 0;
  const busy = upload.isPending || remove.isPending;

  function addPending(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const added = Array.from(fileList).map((file) => ({ file, url: isPdf(file.name) ? undefined : URL.createObjectURL(file) }));
    setPendingFiles((current) => [...current, ...added]);
  }

  function removePendingAt(index: number) {
    setPendingFiles((current) => {
      const target = current[index];
      if (target.url) URL.revokeObjectURL(target.url);
      return current.filter((_, i) => i !== index);
    });
  }

  function markRemoved(id: string) {
    setRemovedIds((current) => new Set(current).add(id));
  }

  function discard() {
    pendingFiles.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPendingFiles([]);
    setRemovedIds(new Set());
  }

  async function commit(ownerId: string) {
    for (const id of removedIds) {
      await remove.mutateAsync(id);
    }
    for (const { file } of pendingFiles) {
      await upload.mutateAsync({ ownerType, ownerId, file });
    }
    pendingFiles.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPendingFiles([]);
    setRemovedIds(new Set());
  }

  return { visibleFiles, pendingFiles, dirty, busy, addPending, removePendingAt, markRemoved, discard, commit };
}

export function FileStagingGrid({ staging, label }: { staging: ReturnType<typeof useFileStaging>; label: string }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      {staging.visibleFiles.map((file) => (
        <FileTile
          key={file.id}
          name={file.name}
          href={`/api/attachments/${file.id}`}
          thumbnailSrc={isPdf(file.name) ? undefined : `/api/attachments/${file.id}`}
          onRemove={() => staging.markRemoved(file.id)}
        />
      ))}
      {staging.pendingFiles.map((pending, index) => (
        <FileTile
          key={`${pending.file.name}-${index}`}
          name={pending.file.name}
          thumbnailSrc={pending.url}
          onRemove={() => staging.removePendingAt(index)}
        />
      ))}
      <AddFileTile label={label} multiple busy={staging.busy} onSelect={staging.addPending} />
    </Box>
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
