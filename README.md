# Aqua Bond

Aqua Bond has a premium introduction website and a separate hydration tracker. The website lives at the project root; **Get started** opens the tracker at `/#/app`. The tracker supports saved history, invite-code friend connections, and shared progress. No signup or login is required. It creates a private anonymous profile automatically and keeps its session on the current device.

## Run locally

1. Install dependencies with `npm install`.
2. In your Supabase project, enable **Authentication → Sign In / Providers → Allow anonymous sign-ins**. This is required for the app to create a private profile without a signup screen.
3. Copy `.env.example` to `.env` and add the project URL and publishable (anon) key from **Project Settings → API**.
4. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
5. In **Authentication → URL Configuration**, set the Site URL to `https://ezihe-building.github.io/aqua-bond/`.
6. Start the app with `npm run dev`.

The first visit creates a profile automatically. Profiles are private to the browser/device that created them; clearing browser data or switching devices may make an anonymous profile inaccessible. Share your invite code and enter other people's codes in **You** to connect; connected friends can see each other's hydration progress. There is no email signup, login, password recovery, or profile transfer in this version.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project, rerun the latest [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor; it preserves existing profiles and friend links while removing the one-friend limit. **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## Web app and notifications

The tracker can also be installed from a supported browser using its **Install app** prompt; the service worker caches the app shell and checks for web updates. Choose between five bottle designs in **Customize**; the choice is saved on that device. Soft ambient music is enabled where the browser permits playback; if autoplay is blocked, tap the music button in the header. Water reminders and friend-completion notifications use the browser Notification API and require permission; reminders fire while Aqua Bond is open. Background push delivery requires a push service and server-side credentials, which are not included.

## Android app

The Android package is an installable Capacitor app with bundled web assets. It is not a Play Store release or a fully native UI: the interface runs in the app's Android WebView, while Supabase-backed profiles, friends, and progress use the internet. Android code/assets are built by GitHub Actions on pushes to `main` and published to the repository's [latest release](https://github.com/ezihe-building/aqua-bond/releases/latest) as an APK. Android does not silently install updates from GitHub; download each new test build manually. These debug-signed test builds are not production releases; if Android rejects an update, uninstall the old build before installing the new one. Use the browser version if preserving an anonymous device profile is important. A production Android release needs a stable signing key. The app needs internet access to sync data.

To build locally, install the Android SDK and Java 21, then run:

```sh
npm run build:android
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The Android workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the repository's Actions variables. The Supabase publishable key is included in client builds by design; never use a `service_role` or secret key in this frontend. iOS builds and App Store distribution are not configured.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## Deploy to GitHub Pages

The `main` branch deploys the landing website to GitHub Pages through `.github/workflows/deploy.yml`. The same workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the repository's Actions variables. Database access must remain protected by the row-level security policies in `supabase/schema.sql`.
