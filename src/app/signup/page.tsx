import { SignupForm } from "@/components/dhel/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <SignupForm error={params.error} />;
}
