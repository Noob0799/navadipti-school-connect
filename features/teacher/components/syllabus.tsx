"use client";

import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { useSaveSyllabus, useTeacherSyllabus } from "../queries";
import { EditableFiles, TeacherUpload } from "./common";

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
            <Stack spacing={3} sx={{ mt: 1 }}>
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
  const [content, setContent] = useState(term.content);
  const [saved, setSaved] = useState(false);
  const [missing, setMissing] = useState(false);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography sx={{ fontWeight: 700 }}>{term.termLabel}</Typography>
        <Chip size="small" label={term.exists ? "Published" : "Not published"} color={term.exists ? "success" : "default"} />
      </Stack>
      {save.isError && <Alert severity="error">{save.error.message}</Alert>}
      {missing && <Alert severity="error" onClose={() => setMissing(false)}>Write the syllabus before publishing.</Alert>}
      {saved && <Alert severity="success" onClose={() => setSaved(false)}>Saved. The class has been notified.</Alert>}
      <TextField multiline minRows={3} label="Syllabus" value={content} onChange={(e) => setContent(e.target.value)} />
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          disabled={save.isPending}
          onClick={() => {
            if (content.trim() === "") return setMissing(true);
            setMissing(false);
            save.mutate({ offeringSubjectId, termName: term.termName, content }, { onSuccess: () => setSaved(true) });
          }}
        >
          {save.isPending ? "Saving…" : term.exists ? "Save changes" : "Publish syllabus"}
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>Attachments</Typography>
      {term.exists ? (
        <Stack spacing={1}>
          <EditableFiles files={term.files} />
          <TeacherUpload ownerType="SYLLABUS" ownerId={term.syllabusId ?? ""} label="Attach file" />
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="body2">Publish the syllabus first, then attach files.</Typography>
      )}
    </Stack>
  );
}

