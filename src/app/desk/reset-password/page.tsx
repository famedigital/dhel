"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/dhel/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/desk";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="New password"
      description="Choose a new password for your account."
      error={error}
      footer={
        <Link href="/desk/login" className="auth-link">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="auth-form">
        <div className="auth-field">
          <Label htmlFor="password" className="auth-label">
            New password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="auth-submit" size="lg" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
