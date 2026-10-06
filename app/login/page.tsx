import { Box, Container, Typography } from "@mui/material";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          bgcolor: "#1F3430",
          color: "#F4F7F2",
          p: { xs: 3, md: 7 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <Typography
          sx={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F4B73E" }}
        >
          Navadipti School Connect
        </Typography>
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: 36, md: 56 }, lineHeight: 1, letterSpacing: "-0.025em" }}>
            Class is in session. Everything in one place.
          </Typography>
          <Box component="svg" viewBox="0 0 320 20" sx={{ width: 300, maxWidth: "80%", mt: 2 }} aria-hidden="true">
            <path d="M4 13 C 70 2, 130 21, 190 9 S 290 5, 316 11" fill="none" stroke="#F4B73E" strokeWidth="5" strokeLinecap="round" />
          </Box>
        </Box>
        <Typography sx={{ maxWidth: "36ch", opacity: 0.88, fontSize: 18 }}>
          Homework, tests and results for every class from Nursery to Class 5, shared by the principal, teachers and students.
        </Typography>
      </Box>
      <Container maxWidth="xs" sx={{ display: "grid", alignContent: "center", py: 6 }}>
        <Typography variant="h3" sx={{ fontSize: 26, mb: 0.5 }}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use the phone number and password your school gave you.
        </Typography>
        <LoginForm />
      </Container>
    </Box>
  );
}
