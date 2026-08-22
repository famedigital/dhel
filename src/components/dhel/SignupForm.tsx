import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AuthShell } from "@/components/dhel/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({ error }: { error?: string | null }) {
  return (
    <AuthShell
      title="Create account"
      description="Set up your agency workspace."
      error={error}
      footer={
        <p>
          Already registered?{" "}
          <Link href="/desk/login" className="auth-link">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleSignInButton next="/desk" />
      <div className="auth-divider">
        <span>or</span>
      </div>
      <form action={signUp} className="auth-form">
        <div className="auth-field">
          <Label htmlFor="email" className="auth-label">
            Work email
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@agency.com" required />
        </div>
        <div className="auth-field">
          <Label htmlFor="password" className="auth-label">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="auth-submit" size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
