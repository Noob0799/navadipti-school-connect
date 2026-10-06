"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { FileRef } from "../queries";
import { useDeleteFile, useUploadFile } from "../queries";

export function isPdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

export function FileLinks({ files, removable = false }: { files: FileRef[]; removable?: boolean }) {
  const deleteFile = useDeleteFile();
  if (files.length === 0) return <Typography color="text.secondary">No files yet.</Typography>;
  return (
    <Stack spacing={1}>
      {files.map((file) => (
        <Stack key={file.id} direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" href={`/api/attachments/${file.id}`} target="_blank" rel="noreferrer">
            {file.name}
          </Button>
          {removable && (
            <Button size="small" color="error" disabled={deleteFile.isPending} onClick={() => deleteFile.mutate(file.id)}>
              Remove
            </Button>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

export function FilePreview({ file }: { file: FileRef }) {
  if (isPdf(file.name)) {
    return (
      <Box component="iframe" title={file.name} src={`/api/attachments/${file.id}`} sx={{ width: "100%", height: { xs: 420, md: 620 }, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fff" }} />
    );
  }
  return (
    <Box component="img" alt={file.name} src={`/api/attachments/${file.id}`} sx={{ display: "block", maxWidth: "100%", maxHeight: 620, borderRadius: 2, border: "1px solid", borderColor: "divider" }} />
  );
}

export function UploadAnswer({
  ownerType,
  ensureOwner,
  label,
}: {
  ownerType: "HOMEWORK_SUBMISSION" | "TEST_SUBMISSION";
  ensureOwner: () => Promise<string>;
  label: string;
}) {
  const upload = useUploadFile();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const ownerId = await ensureOwner();
      await upload.mutateAsync({ ownerType, ownerId, file });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box>
        <Button component="label" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {busy ? "Uploading…" : label}
          <input hidden type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => onChange(e.target.files?.[0])} />
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">PDF, JPG or PNG, up to 10 MB. You can upload again to replace your work.</Typography>
    </Stack>
  );
}
