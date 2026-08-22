"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/dhel/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm({ next = "/desk" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/desk/reset-password?next=${encodeURIComponent(next)}`,
    });
    if (err) {
      setError(err.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <AuthShell
      title="Reset password"
      description="We will email you a reset link."
      error={error}
      message={status === "sent" ? `Check your inbox for ${email}` : null}
      footer={
        <Link href="/desk/login" className="auth-link">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="auth-form">
        <div className="auth-field">
          <Label htmlFor="email" className="auth-label">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.com"
            required
          />
        </div>
        <Button type="submit" className="auth-submit" size="lg" disabled={status === "loading" || status === "sent"}>
          {status === "loading" ? "Sending…" : status === "sent" ? "Email sent" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
