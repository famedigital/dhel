import { ForgotPasswordForm } from "@/components/dhel/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <ForgotPasswordForm next={params.next || "/desk"} />;
}
