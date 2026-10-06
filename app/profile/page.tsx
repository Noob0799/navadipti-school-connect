import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { ChangePasswordCard } from "@/features/accounts/components/password";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 12 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.75 }}>{children}</Box>
    </Box>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      phoneNumber: true,
      role: true,
      teacherSubjectExpertise: { select: { subject: { select: { name: true } } }, orderBy: { subject: { name: "asc" } } },
      studentProfile: { select: { schoolId: true } },
    },
  });
  if (!user) return null;

  const currentClass = user.role === "STUDENT"
    ? await db.enrollment.findFirst({
        where: { studentId: session.userId, status: "ENROLLED", classOffering: { academicSession: { status: "ACTIVE" } } },
        select: { classOffering: { select: { schoolClass: { select: { name: true } } } } },
      })
    : null;

  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Profile</Typography>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2.5} sx={{ alignItems: "center", pb: 3, mb: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 22, fontWeight: 800 }}>
              {initials(user.name)}
            </Avatar>
            <Stack spacing={0.5}>
              <Typography variant="h2" sx={{ fontSize: 24, lineHeight: 1.2 }}>{user.name}</Typography>
              <Box sx={{ alignSelf: "flex-start", px: 1.1, py: 0.25, borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {ROLE_LABEL[user.role]}
              </Box>
            </Stack>
          </Stack>
          <Typography variant="h3" sx={{ mb: 2 }}>Your details</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            <Field label="Phone number">
              <Typography sx={{ fontFamily: "var(--font-mono)" }}>{user.phoneNumber}</Typography>
            </Field>
            {user.role === "STUDENT" && (
              <>
                <Field label="School ID">
                  <Typography sx={{ fontFamily: "var(--font-mono)" }}>{user.studentProfile?.schoolId ?? "–"}</Typography>
                </Field>
                <Field label="Class this session">
                  <Typography>{currentClass?.classOffering.schoolClass.name ?? "Not enrolled"}</Typography>
                </Field>
              </>
            )}
            {user.role === "TEACHER" && (
              <Field label="Subjects of expertise">
                {user.teacherSubjectExpertise.length === 0
                  ? <Typography color="text.secondary">None yet</Typography>
                  : <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {user.teacherSubjectExpertise.map((e) => <Chip key={e.subject.name} size="small" label={e.subject.name} />)}
                    </Stack>}
              </Field>
            )}
          </Box>
        </CardContent>
      </Card>
      <ChangePasswordCard userId={session.userId} />
    </Stack>
  );
}
