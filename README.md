# Aqua Bond

Aqua Bond is a mobile-first hydration challenge with saved history, invite-code friend connections, and live progress. No signup or login is required. The app creates a private anonymous profile automatically and keeps its session in the current browser.

## Run locally

1. Install dependencies with `npm install`.
2. In your Supabase project, enable **Authentication → Sign In / Providers → Allow anonymous sign-ins**. This is required for the app to create a private profile without a signup screen.
3. Copy `.env.example` to `.env` and add the project URL and publishable (anon) key from **Project Settings → API**.
4. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
5. In **Authentication → URL Configuration**, set the Site URL to `https://ezihe-building.github.io/aqua-bond/`.
6. Start the app with `npm run dev`.

The first visit creates a profile automatically. Profiles are private to the browser/device that created them; clearing browser data or switching devices may make an anonymous profile inaccessible. Share your invite code and enter other people's codes in **You** to connect; connected friends can see each other's hydration progress. There is no email signup, login, password recovery, or profile transfer in this version.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project, rerun the latest [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor; it preserves existing profiles and friend links while removing the one-friend limit. **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## Install and notifications

The app includes a web app manifest and service worker for installation and cached app-shell access, with responsive layouts for phones and tablets. On Android Chrome, use the browser's **Install app** prompt. Installed versions check for updates when opened or brought back into focus; when one is ready, choose **Update now** in the app. A new water scene uses an optimized local photo poster ([Unsplash](https://unsplash.com/)) and an optional user-played water video ([Pexels](https://www.pexels.com/video/blue-water-rippling-on-surface-855589/)), which is not downloaded until played. Choose between five bottle designs in **Customize**; the choice is saved on that device. Soft ambient music is enabled by default where the browser permits playback; if autoplay is blocked, tap the music button in the header to start it. Use the same button to turn the music off. Water reminders and friend-completion notifications use the browser Notification API and require permission; reminders fire while Aqua Bond is open. Background push delivery requires a push service and server-side credentials, which are not included.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## Deploy to GitHub Pages

The `main` branch deploys to GitHub Pages through the workflow in `.github/workflows/deploy.yml`. The workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the repository's Actions variables. The Supabase publishable key is included in the browser app by design; database access must remain protected by the row-level security policies in `supabase/schema.sql`. Never use a `service_role` or secret key in this frontend.
