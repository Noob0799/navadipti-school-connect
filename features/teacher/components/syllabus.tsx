"use client";

import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { FileLinks } from "@/features/student/components/files";
import { useSaveSyllabus, useTeacherSyllabus } from "../queries";
import { FileStagingGrid, useFileStaging } from "./common";

export function TeacherSyllabusView() {
  const syllabus = useTeacherSyllabus();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Syllabus</Typography>
      <Typography color="text.secondary">Write the syllabus for each term. Saving notifies the class.</Typography>
      {syllabus.isError && <Alert severity="error">{syllabus.error.message}</Alert>}
      {syllabus.data?.length === 0 && <Alert severity="info">You are not assigned to any class this session.</Alert>}
      {syllabus.data?.map((subject) => (
        <Card key={subject.offeringSubjectId}>
          <CardContent>
            <Typography variant="h3">{subject.className} · {subject.subject}</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {subject.terms.map((term) => (
                <TermEditor key={`${subject.offeringSubjectId}-${term.termName}`} offeringSubjectId={subject.offeringSubjectId} term={term} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function TermEditor({ offeringSubjectId, term }: { offeringSubjectId: string; term: { termName: string; termLabel: string; syllabusId: string | null; content: string; exists: boolean; files: { id: string; name: string }[] } }) {
  const save = useSaveSyllabus();
  const staging = useFileStaging(term.files, "SYLLABUS");
  const [content, setContent] = useState(term.content);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const busy = save.isPending || staging.busy;
  const attachmentCount = staging.visibleFiles.length + staging.pendingFiles.length;
  const showForm = editing || !term.exists;

  function startEdit() {
    setContent(term.content);
    setLocalError(null);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setContent(term.content);
    staging.discard();
    setLocalError(null);
    setSaveError(null);
    setEditing(false);
  }

  function publish() {
    setLocalError(null);
    setSaveError(null);
    if (content.trim() === "" && attachmentCount === 0) return setLocalError("Write the syllabus or attach a file before publishing.");
    save.mutate({ offeringSubjectId, termName: term.termName, content }, {
      onSuccess: async (result) => {
        try {
          await staging.commit(result.id);
          setSaved(true);
          setEditing(false);
        } catch (e) {
          setSaveError(e instanceof Error ? e.message : "Some changes failed to save. Try again.");
        }
      },
      onError: (e) => setSaveError(e.message),
    });
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{term.termLabel}</Typography>
            <Chip size="small" label={term.exists ? "Published" : "Not published"} color={term.exists ? "success" : "default"} />
          </Stack>
          {term.exists && !editing && <Button size="small" onClick={startEdit}>Edit</Button>}
        </Stack>
        {save.isError && <Alert severity="error">{save.error.message}</Alert>}
        {saveError && <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
        {localError && <Alert severity="error" onClose={() => setLocalError(null)}>{localError}</Alert>}
        {saved && <Alert severity="success" onClose={() => setSaved(false)}>Saved. The class has been notified.</Alert>}

        {showForm ? (
          <>
            <TextField multiline minRows={3} label="Syllabus" value={content} onChange={(e) => setContent(e.target.value)} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Attachments</Typography>
            <FileStagingGrid staging={staging} label="Attach file" />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Button variant="contained" disabled={busy} onClick={publish}>
                {busy ? "Saving…" : term.exists ? "Save changes" : "Publish syllabus"}
              </Button>
              {term.exists && <Button variant="outlined" disabled={busy} onClick={cancelEdit}>Cancel</Button>}
            </Stack>
          </>
        ) : (
          <>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{term.content || "No syllabus text."}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>Attachments</Typography>
            <FileLinks files={term.files} />
          </>
        )}
      </Stack>
    </Box>
  );
}
