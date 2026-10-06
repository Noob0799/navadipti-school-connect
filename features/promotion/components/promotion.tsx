"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Checkbox } from "@mui/material";
import { apiRequest } from "@/lib/client-api";
import { useClassOfferings } from "@/features/teachers/queries";

type Review = {
  classOfferingId: string;
  className: string;
  sessionLabel: string;
  upcomingSessionLabel: string | null;
  isFinalClass: boolean;
  subjects: { offeringSubjectId: string; name: string }[];
  students: {
    id: string;
    name: string;
    schoolId: string;
    subjects: { offeringSubjectId: string; name: string; total: number; allGraded: boolean; passed: boolean }[];
  }[];
  totals: { max: number; pass: number };
};

export function PromotionPage() {
  const offerings = useClassOfferings();
  const [classId, setClassId] = useState<string | null>(null);

  if (offerings.isPending) return <Skeleton variant="rounded" height={200} />;
  if (offerings.isError) return <Alert severity="error">{offerings.error.message}</Alert>;
  if (!offerings.data.session) return <Alert severity="info">There is no active session, so there is nothing to promote from.</Alert>;

  const selected = classId ?? offerings.data.classes[0]?.id ?? "";

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1" sx={{ fontSize: 30 }}>Promotion</Typography>
        <Typography color="text.secondary">
          Review each class at the end of {offerings.data.session.label}. Checked students move up. Unchecked students repeat their class.
        </Typography>
      </Stack>
      <TextField select label="Class" value={selected} onChange={(e) => setClassId(e.target.value)} sx={{ maxWidth: 260 }}>
        {offerings.data.classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
      </TextField>
      {selected && <ClassReview key={selected} classOfferingId={selected} />}
    </Stack>
  );
}

function ClassReview({ classOfferingId }: { classOfferingId: string }) {
  const review = useQuery({
    queryKey: ["principal", "promotion", classOfferingId],
    queryFn: () => apiRequest<Review>(`/api/class-offerings/${classOfferingId}/promotion-review`),
  });

  if (review.isPending) return <Skeleton variant="rounded" height={200} />;
  if (review.isError) return <Alert severity="error">{review.error.message}</Alert>;
  return <ReviewTable review={review.data} />;
}

function ReviewTable({ review }: { review: Review }) {
  const queryClient = useQueryClient();
  const isComplete = (s: Review["students"][number]) => s.subjects.every((sub) => sub.allGraded);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(
    review.students.filter((s) => isComplete(s) && s.subjects.every((sub) => sub.passed)).map((s) => s.id),
  ));
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const promote = useMutation({
    mutationFn: () =>
      apiRequest<{ promoted: number; retained: number; graduated: number; into: string }>(`/api/class-offerings/${review.classOfferingId}/promote`, {
        method: "POST",
        body: JSON.stringify({ promotedStudentIds: Array.from(selected) }),
      }),
    onSuccess: (r) => {
      setConfirming(false);
      setResult(
        r.graduated
          ? `${r.promoted} promoted, ${r.graduated} graduated, ${r.retained} retained for ${r.into}.`
          : `${r.promoted} promoted and ${r.retained} retained for ${r.into}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["principal"] });
    },
  });

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const decidable = review.students.filter(isComplete);
  const promotedCount = decidable.filter((s) => selected.has(s.id)).length;
  const retainedCount = decidable.length - promotedCount;
  const nextLabel = review.upcomingSessionLabel;

  return (
    <Stack spacing={2}>
      {result && <Alert severity="success" onClose={() => setResult(null)}>{result}</Alert>}
      {!nextLabel && (
        <Alert severity="warning">
          Create the next session before promoting.{" "}
          <Link href="/principal/sessions" style={{ fontWeight: 700, textDecoration: "underline" }}>Go to sessions</Link>
        </Alert>
      )}
      {nextLabel && (
        <Typography color="text.secondary">
          Promoting into <b style={{ fontFamily: "var(--font-mono)" }}>{nextLabel}</b>.{" "}
          {review.isFinalClass ? "Students who pass the final class graduate and leave the school." : ""}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        Totals are out of {review.totals.max} across four tests. Pass mark {review.totals.pass}. Students who passed every subject are pre-checked. Change any box before you promote.
      </Typography>

      {review.students.length === 0 ? (
        <Alert severity="info">No students are enrolled in {review.className} this session.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Student</TableCell>
                {review.subjects.map((s) => <TableCell key={s.offeringSubjectId}>{s.name}</TableCell>)}
                <TableCell>Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {review.students.map((student) => {
                const checked = selected.has(student.id);
                const complete = isComplete(student);
                return (
                  <TableRow key={student.id} selected={checked}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={checked}
                        disabled={!complete}
                        onChange={() => toggle(student.id)}
                        slotProps={{ input: { "aria-label": `Promote ${student.name}` } as React.InputHTMLAttributes<HTMLInputElement> }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{student.name}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)" }}>{student.schoolId}</Typography>
                    </TableCell>
                    {student.subjects.map((sub) => (
                      <TableCell key={sub.offeringSubjectId}>
                        <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)" }}>{sub.total}/{review.totals.max}</Typography>
                        {!sub.allGraded
                          ? <Chip size="small" color="warning" label="In progress" />
                          : <Chip size="small" color={sub.passed ? "success" : "error"} label={sub.passed ? "Pass" : "Fail"} />}
                      </TableCell>
                    ))}
                    <TableCell>
                      {complete ? (
                        <Chip size="small" color={checked ? "success" : "default"} label={checked ? (review.isFinalClass ? "Graduate" : "Promote") : `Repeat ${review.className}`} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">Awaiting results</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {review.students.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Button variant="contained" disabled={!nextLabel || decidable.length !== review.students.length} onClick={() => setConfirming(true)}>
            Promote {promotedCount}, retain {retainedCount}
          </Button>
          {decidable.length !== review.students.length && (
            <Typography variant="body2" color="text.secondary">Promotion unlocks once every student&apos;s results are in.</Typography>
          )}
        </Stack>
      )}

      <Dialog open={confirming} onClose={() => setConfirming(false)}>
        <DialogTitle>Confirm promotion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {promotedCount} student(s) will move on{review.isFinalClass ? " and graduate" : ""}, and {retainedCount} will repeat {review.className}. Students are enrolled into {nextLabel}. This can&apos;t be undone from this screen.
          </DialogContentText>
          {promote.isError && <Alert severity="error" sx={{ mt: 2 }}>{promote.error.message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant="contained" disabled={promote.isPending} onClick={() => promote.mutate()}>
            {promote.isPending ? "Promoting…" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
