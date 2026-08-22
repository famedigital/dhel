# Google sign-in setup (pelbuItinerary)

Supabase project: **npqxvxvwjanpjlpggddx** only (pelbuItinerary).  
Google Client ID / Secret are stored in the **Supabase Auth Google provider**, not in the Next.js app.

The OAuth client secret must never be committed or set as a `NEXT_PUBLIC_*` variable.

Non-secret Client ID (reference only):

```text
635597762559-6kn15t8pbc641tqvbvo7ef8l74f9l095.apps.googleusercontent.com
```

Google Cloud project id: `pelbuos`

---

## 1. Google Cloud Console

Open [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) (or APIs & Services → Credentials) for project **pelbuos**.

### Authorized JavaScript origins

Add:

| Environment | Origin |
|-------------|--------|
| Local | `http://localhost:3000` |
| Production | `https://YOUR-VERCEL-DOMAIN` (e.g. `https://itinerary-studio.vercel.app`) |

### Authorized redirect URIs

Add **exactly** (Supabase handles the Google callback):

```text
https://npqxvxvwjanpjlpggddx.supabase.co/auth/v1/callback
```

Do **not** put `http://localhost:3000/auth/callback` here for the standard Supabase web OAuth flow.  
After Google finishes, Supabase redirects the browser to your app’s PKCE callback (configured in Supabase URL settings below).

Scopes (Data Access): `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.

---

## 2. Supabase Dashboard (required — cannot be done from this repo)

Open [Authentication → Providers → Google](https://supabase.com/dashboard/project/npqxvxvwjanpjlpggddx/auth/providers):

1. Enable **Google**.
2. Paste **Client ID** and **Client Secret** from Google (secret stays only here).
3. Save.

### Site URL + Redirect URLs

Open [Authentication → URL Configuration](https://supabase.com/dashboard/project/npqxvxvwjanpjlpggddx/auth/url-configuration):

| Setting | Value |
|---------|--------|
| **Site URL** (local dev) | `http://localhost:3000` |
| **Site URL** (production) | `https://YOUR-VERCEL-DOMAIN` |

**Redirect URLs** allowlist (add all you use):

```text
http://localhost:3000/auth/callback
http://localhost:3000/**
https://YOUR-VERCEL-DOMAIN/auth/callback
https://YOUR-VERCEL-DOMAIN/**
```

Wildcards help for `next` query params (`/auth/callback?next=/dashboard`). Adjust when you know the production host.

---

## 3. App code (already wired)

- Login / signup: **Continue with Google** → `signInWithOAuth({ provider: 'google' })`
- Callback: `/auth/callback` exchanges the PKCE `code` for a session (cookies via `@supabase/ssr`)
- Middleware already treats `/auth/*` as public
- New Google users with no agency membership are sent to **onboarding** from the dashboard

No Google Client Secret is required in `.env.local`.

Optional env (not required for OAuth):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. End-to-end check

1. Complete steps 1–2 above (Google redirect + Supabase provider + URL allowlist).
2. `npm run dev` → open `/login`.
3. Click **Continue with Google**.
4. Expect Google consent → back to `/auth/callback` → `/dashboard` (or `/onboarding` if first time).

If you see “provider is not enabled”, the Supabase Google provider is off or missing the secret.

---

## Management API (optional alternative to dashboard)

If you have a [Supabase personal access token](https://supabase.com/dashboard/account/tokens):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."
export PROJECT_REF="npqxvxvwjanpjlpggddx"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "YOUR_CLIENT_ID",
    "external_google_secret": "YOUR_CLIENT_SECRET"
  }'
```

Still never commit the secret or put it in the frontend.

---

## Security

If this Client Secret was shared in chat, email, or a ticket, rotate it in Google Cloud Console (Clients → your OAuth client → Reset secret), then update the Supabase Google provider with the new secret.
