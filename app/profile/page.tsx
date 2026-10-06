import { Stack, Typography } from "@mui/material";
import { ChangePasswordCard } from "@/features/accounts/components/password";
import { getSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getSession();
  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: 30 }}>Profile</Typography>
      {session && <ChangePasswordCard userId={session.userId} />}
    </Stack>
  );
}
