"use client";

import { Alert, Card, CardContent, Chip, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";
import { useResults, useSyllabus } from "../queries";

export function SyllabusView() {
  const syllabus = useSyllabus();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Syllabus</Typography>
      {syllabus.isPending && <Skeleton variant="rounded" height={160} />}
      {syllabus.isError && <Alert severity="error">{syllabus.error.message}</Alert>}
      {syllabus.data?.length === 0 && <Alert severity="info">No syllabus has been published for your class yet.</Alert>}
      {syllabus.data?.map((subject) => (
        <Card key={subject.subject}>
          <CardContent>
            <Typography variant="h3">{subject.subject}</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {subject.terms.filter((t) => t.syllabus).map((term) => (
                <Stack key={term.termName} spacing={0.5}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{term.termLabel}</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{term.syllabus?.content}</Typography>
                </Stack>
              ))}
              {subject.terms.every((t) => !t.syllabus) && <Typography color="text.secondary">Not published yet.</Typography>}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function ResultsView() {
  const results = useResults();

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Results</Typography>
      <Typography color="text.secondary">Each subject totals four tests out of 150. The pass mark is 60.</Typography>
      {results.isPending && <Skeleton variant="rounded" height={160} />}
      {results.isError && <Alert severity="error">{results.error.message}</Alert>}
      {results.data?.map((subject) => (
        <Card key={subject.subject}>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <Typography variant="h3" sx={{ mb: 0 }}>{subject.subject}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontFamily: "var(--font-mono)" }}>{subject.total} / {subject.totalMax}</Typography>
                {subject.allGraded
                  ? <Chip size="small" color={subject.passed ? "success" : "error"} label={subject.passed ? "Pass" : "Fail"} />
                  : <Chip size="small" color="warning" label="Grading in progress" />}
              </Stack>
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Test</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subject.tests.map((test) => (
                    <TableRow key={test.testId}>
                      <TableCell>{test.termLabel}</TableCell>
                      <TableCell sx={{ fontFamily: "var(--font-mono)" }}>{test.marks ?? "–"} / {test.max}</TableCell>
                      <TableCell>
                        {test.marks === null
                          ? <Chip size="small" color="warning" label="Not graded" />
                          : <Chip size="small" color={test.marks >= test.pass ? "success" : "error"} label={test.marks >= test.pass ? "Pass" : "Fail"} />}
                      </TableCell>
                      <TableCell>{test.remark ?? "–"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
