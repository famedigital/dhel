/**
 * Copy to: src/app/settings/page.tsx (or /profile/page.tsx)
 * Uses panel / form classes from globals.css — no extra deps.
 */
import { AppShell } from "@/components/AppShell";

export default function ProfilePageExample() {
  return (
    <AppShell
      brandName="My App"
      displayName="Jane Agent"
      email="jane@example.com"
      role="owner"
    >
      <h1 className="page-title">Profile</h1>
      <p className="page-lead">
        Update your display name, photo, and notification preferences.
      </p>

      <div className="panel">
        <p className="section-title">Photo</p>
        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
          JA
        </div>
        <button type="button" className="btn btn-secondary btn-sm">
          Upload photo
        </button>
        <p className="field-hint mt-2">PNG or JPG, max 2 MB.</p>
      </div>

      <form className="form-stack panel">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="display_name">Display name</label>
            <input
              className="input"
              id="display_name"
              name="display_name"
              defaultValue="Jane Agent"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              defaultValue="jane@example.com"
              readOnly
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea
            className="textarea"
            id="bio"
            name="bio"
            rows={4}
            placeholder="Short intro for your team…"
          />
        </div>
        <div className="split-actions">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          <button type="button" className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>

      <div className="panel">
        <p className="section-title">Notifications</p>
        <div className="form-stack">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            Email me when someone mentions me
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" />
            Weekly digest
          </label>
        </div>
      </div>
    </AppShell>
  );
}
