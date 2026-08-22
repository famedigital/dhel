import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthShell } from "@/components/dhel/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  next = "/desk",
  error,
  message,
}: {
  next?: string;
  error?: string | null;
  message?: string | null;
}) {
  return (
    <AuthShell
      error={error}
      message={message}
      footer={
        <p>
          New agency?{" "}
          <Link href="/signup" className="auth-link">
            Create an account
          </Link>
          <span className="auth-footer-dot"> · </span>
          <Link href="/" className="auth-link-muted">
            Public home
          </Link>
        </p>
      }
    >
      <GoogleSignInButton next={next} />
      <div className="auth-divider">
        <span>or</span>
      </div>
      <form action={signIn} className="auth-form">
        <input type="hidden" name="next" value={next} />
        <div className="auth-field">
          <Label htmlFor="email" className="auth-label">
            Email
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@agency.com" required />
        </div>
        <div className="auth-field">
          <div className="auth-label-row">
            <Label htmlFor="password" className="auth-label">
              Password
            </Label>
            <Link
              href={`/desk/forgot-password${next !== "/desk" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="auth-link-muted text-xs"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="auth-submit" size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
