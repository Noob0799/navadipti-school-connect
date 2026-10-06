import { Typography } from "@mui/material";
import { NewStudent } from "@/features/students/components/students";

export default function NewStudentPage() {
  return (
    <>
      <Typography variant="h1" sx={{ fontSize: 30, mb: 3 }}>Enrol student</Typography>
      <NewStudent />
    </>
  );
}
