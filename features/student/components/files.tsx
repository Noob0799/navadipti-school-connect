"use client";

import { useState } from "react";
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import type { FileRef } from "../queries";
import { useDeleteFile, useUploadFile } from "../queries";

export function isPdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

const TILE_SIZE = 112;

export function FileTile({
  name,
  href,
  thumbnailSrc,
  onRemove,
  removing,
}: {
  name: string;
  href?: string;
  thumbnailSrc?: string;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const pdf = isPdf(name);
  return (
    <Box sx={{ position: "relative", width: TILE_SIZE, flexShrink: 0 }}>
      {onRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${name}`}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 1,
            width: 22,
            height: 22,
            bgcolor: "rgba(22,48,42,0.7)",
            color: "#fff",
            "&:hover": { bgcolor: "rgba(22,48,42,0.9)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
      <Box
        component={href ? "a" : "div"}
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noreferrer" : undefined}
        sx={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            borderBottom: "none",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            overflow: "hidden",
          }}
        >
          {pdf || !thumbnailSrc
            ? <InsertDriveFileOutlinedIcon sx={{ fontSize: 28, color: "text.secondary" }} />
            : <Box component="img" src={thumbnailSrc} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </Box>
        <Typography
          variant="body2"
          title={name}
          sx={{
            fontSize: 12,
            px: 1,
            py: 0.75,
            border: "1px solid",
            borderColor: "divider",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </Typography>
      </Box>
    </Box>
  );
}

export function AddFileTile({ label, onSelect, multiple, busy }: { label: string; onSelect: (files: FileList | null) => void; multiple?: boolean; busy?: boolean }) {
  return (
    <Box
      component="label"
      sx={{
        width: TILE_SIZE,
        height: 104,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        px: 1,
        textAlign: "center",
        border: "1.5px dashed",
        borderColor: "divider",
        borderRadius: 2,
        color: "text.secondary",
        cursor: busy ? "default" : "pointer",
        "&:hover": busy ? undefined : { borderColor: "primary.main", color: "primary.main" },
      }}
    >
      {busy ? <CircularProgress size={18} /> : <AddOutlinedIcon fontSize="small" />}
      <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <input hidden type="file" multiple={multiple} accept=".pdf,image/png,image/jpeg" disabled={busy} onChange={(e) => { onSelect(e.target.files); e.target.value = ""; }} />
    </Box>
  );
}

export function FileChips({ files }: { files: FileRef[] }) {
  if (files.length === 0) return <Typography variant="body2" color="text.secondary">–</Typography>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {files.map((file) => (
        <Tooltip key={file.id} title={file.name}>
          <IconButton
            component="a"
            href={`/api/attachments/${file.id}`}
            target="_blank"
            rel="noreferrer"
            size="small"
            aria-label={file.name}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
          >
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
}

export function FileLinks({ files }: { files: FileRef[] }) {
  if (files.length === 0) return <Typography color="text.secondary">No files yet.</Typography>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      {files.map((file) => (
        <FileTile
          key={file.id}
          name={file.name}
          href={`/api/attachments/${file.id}`}
          thumbnailSrc={isPdf(file.name) ? undefined : `/api/attachments/${file.id}`}
        />
      ))}
    </Box>
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

type PendingFile = { file: File; url?: string };
type SubmissionOwnerType = "HOMEWORK_SUBMISSION" | "TEST_SUBMISSION";

export function useFileStaging(files: FileRef[], ownerType: SubmissionOwnerType) {
  const upload = useUploadFile();
  const remove = useDeleteFile();
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
