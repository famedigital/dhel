import { LoginForm } from "@/components/dhel/LoginForm";

export default async function DeskLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      next={params.next || "/desk"}
      error={params.error}
      message={params.message}
    />
  );
}
