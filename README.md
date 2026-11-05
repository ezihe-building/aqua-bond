# Aqua Bond

Aqua Bond is a mobile-first hydration challenge. It includes a local-only mode for trying the app on one device, and a Supabase-backed mode for private profiles, saved history, invite-code connections, and live progress for followed friends. With Supabase configured, the app creates a private anonymous session automatically: users do not need to register with an email or password.

## Run locally

1. Install dependencies with `npm install`.
2. In your Supabase project, enable **Authentication → Sign In / Providers → Anonymous Sign-Ins**.
3. Copy `.env.example` to `.env` and add the project URL and publishable (anon) key from **Project Settings → API**.
4. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
5. Start the app with `npm run dev`.

Without Supabase credentials, the app opens in local mode. Its profile and logs are stored only in that browser and are not shared or synchronized. With Supabase configured, each browser/device gets its own private anonymous profile automatically. Set your name in **You**, share your invite code, and enter other people's codes there to connect with multiple friends. As with the original buddy feature, connected friends can see each other's hydration progress. The anonymous session is persisted on the device; clearing browser storage loses access to that profile and its data.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project, rerun the latest [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor; it preserves existing profiles and friend links while removing the one-friend limit. **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## Install and notifications

The app includes a web app manifest and service worker for installation and cached app-shell access, with responsive layouts for phones and tablets. On Android Chrome, use the browser's **Install app** prompt. Soft ambient music is enabled by default where the browser permits playback; if autoplay is blocked, tap the music button in the header to start it. Use the same button to turn the music off. Water reminders and friend-completion notifications use the browser Notification API and require permission; reminders fire while Aqua Bond is open. Background push delivery requires a push service and server-side credentials, which are not included.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## Deploy to GitHub Pages

The `main` branch deploys to GitHub Pages through the workflow in `.github/workflows/deploy.yml`. The workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the repository's Actions variables. The Supabase publishable key is included in the browser app by design; database access must remain protected by the row-level security policies in `supabase/schema.sql`. Never use a `service_role` or secret key in this frontend.
