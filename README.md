# Aqua Bond

Aqua Bond is a mobile-first hydration challenge with individual email/password accounts, saved history, invite-code friend connections, and live progress. Each person signs in to their own account; sharing the website link does not share the current user's data. Existing anonymous profiles can be upgraded with an email and password without losing their history or connections.

## Run locally

1. Install dependencies with `npm install`.
2. In your Supabase project, enable **Authentication → Sign In / Providers → Email** and **manual identity linking**. Keep Anonymous Sign-Ins enabled temporarily if existing anonymous profiles still need upgrading.
3. Copy `.env.example` to `.env` and add the project URL and publishable (anon) key from **Project Settings → API**.
4. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
5. In **Authentication → URL Configuration**, set the Site URL to `https://ezihe-building.github.io/aqua-bond/` and add `https://ezihe-building.github.io/aqua-bond/**` and `http://localhost:5173/**` to the allowed redirect URLs. Keep confirmation email templates pointed at `{{ .ConfirmationURL }}`; do not hardcode a localhost URL.
6. Start the app with `npm run dev`.

The built-in Supabase email sender is for testing only: it is limited to 2 auth emails per hour per project and only sends to authorized team addresses. For real sign-ups or repeated testing, configure a transactional email provider under **Authentication → SMTP Settings** in the Supabase Dashboard, then verify its sender domain and credentials with that provider. Do not retry sign-up repeatedly after an email rate-limit error; Supabase may already have created the account. Wait for the limit to reset before requesting another verification email.

On the first visit, create an account or sign in. Existing anonymous sessions are asked to add an email, verify it, and then choose a password; this secures that same profile without losing its progress or friend links. A new account may also require email confirmation before sign-in. Sign out from **You** before another person uses the same browser/device. Share your invite code and enter other people's codes in **You** to connect; connected friends can see each other's hydration progress.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project, rerun the latest [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor; it preserves existing profiles and friend links while removing the one-friend limit. **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## Install and notifications

The app includes a web app manifest and service worker for installation and cached app-shell access, with responsive layouts for phones and tablets. On Android Chrome, use the browser's **Install app** prompt. Soft ambient music is enabled by default where the browser permits playback; if autoplay is blocked, tap the music button in the header to start it. Use the same button to turn the music off. Water reminders and friend-completion notifications use the browser Notification API and require permission; reminders fire while Aqua Bond is open. Background push delivery requires a push service and server-side credentials, which are not included.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## Deploy to GitHub Pages

The `main` branch deploys to GitHub Pages through the workflow in `.github/workflows/deploy.yml`. The workflow reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SITE_URL` from the repository's Actions variables; set `VITE_SITE_URL` to `https://ezihe-building.github.io/aqua-bond/` so verification links return to the deployed app. The Supabase publishable key is included in the browser app by design; database access must remain protected by the row-level security policies in `supabase/schema.sql`. Never use a `service_role` or secret key in this frontend.
