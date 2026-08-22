"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: FormDataEntryValue | null, fallback = "/dashboard") {
  const next = String(value || fallback);
  return next.startsWith("/") ? next : fallback;
}

function appOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/desk/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/onboarding");
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const headerStore = await headers();
  const origin = appOrigin(headerStore);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/desk/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data.url) {
    redirect(data.url);
  }
  redirect(`/desk/login?error=${encodeURIComponent("Could not start Google sign-in")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/desk/login");
}
