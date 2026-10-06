import { Typography } from "@mui/material";
import { TeacherCreate } from "@/features/teachers/components/teacher-create";

export default function NewTeacherPage() {
  return (
    <>
      <Typography variant="h1" sx={{ fontSize: 30, mb: 3 }}>Add teacher</Typography>
      <TeacherCreate />
    </>
  );
}
