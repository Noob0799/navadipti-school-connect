import { Box, Chip, Stack, Typography } from "@mui/material";
import type { FileRef } from "@/features/student/queries";
import { FileLinks } from "@/features/student/components/files";

export type SyllabusTermRow = {
  termLabel: string;
  content: string | null;
  files: FileRef[];
};

export function SyllabusTerms({ rows }: { rows: SyllabusTermRow[] }) {
  return (
    <Stack spacing={2}>
      {rows.map((row) => {
        const published = row.content !== null || row.files.length > 0;
        return (
          <Box
            key={row.termLabel}
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontWeight: 700 }}>{row.termLabel}</Typography>
                <Chip size="small" label={published ? "Published" : "Not published"} color={published ? "success" : "default"} />
              </Stack>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.content || "No syllabus text."}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>Attachments</Typography>
              <FileLinks files={row.files} />
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
