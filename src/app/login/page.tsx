import { redirect } from "next/navigation";

export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.error) q.set("error", params.error);
  if (params.message) q.set("message", params.message);
  q.set("next", params.next || "/desk");
  redirect(`/desk/login?${q.toString()}`);
}
