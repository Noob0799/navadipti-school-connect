import { Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks } from "@/features/student/components/files";

export type SyllabusTableRow = {
  termLabel: string;
  content: string | null;
  files: FileRef[];
};

export function SyllabusTable({ rows }: { rows: SyllabusTableRow[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "44%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>Term</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Syllabus</TableCell>
            <TableCell>Attachments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const published = row.content !== null || row.files.length > 0;
            return (
              <TableRow key={row.termLabel} sx={{ verticalAlign: "top" }}>
                <TableCell sx={{ fontWeight: 700 }}>{row.termLabel}</TableCell>
                <TableCell>
                  <Chip size="small" color={published ? "success" : "default"} label={published ? "Published" : "Not published"} />
                </TableCell>
                <TableCell>
                  {row.content ? (
                    <Tooltip title={row.content} placement="top-start">
                      <Typography
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {row.content}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">–</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {row.files.length > 0 ? <FileLinks files={row.files} /> : <Typography variant="body2" color="text.secondary">–</Typography>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
