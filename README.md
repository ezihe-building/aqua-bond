# Aqua Bond

Aqua Bond has a premium introduction website and a separate Android hydration app. The website is for learning about Aqua Bond and downloading the app; the tracker runs in the installed app, not as a website page. The tracker supports saved history, invite-code friend connections, and shared progress. No signup or login is required. It creates a private anonymous profile automatically and keeps its session on the current device.

## Run locally

1. Install dependencies with `npm install`.
2. In your Supabase project, enable **Authentication → Sign In / Providers → Allow anonymous sign-ins**. This is required for the app to create a private profile without a signup screen.
3. Copy `.env.example` to `.env` and add the project URL and publishable (anon) key from **Project Settings → API**.
4. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
5. In **Authentication → URL Configuration**, set the Site URL to `https://ezihe-building.github.io/aqua-bond/`.
6. Run `npm run dev` to preview the landing page. Build and install the Android package to test the tracker.

The first launch of the Android app creates a profile automatically. Profiles are private to the device that created them; clearing app data or switching devices may make an anonymous profile inaccessible. Share your invite code and enter other people's codes in **You** to connect; connected friends can see each other's hydration progress. There is no email signup, login, password recovery, or profile transfer in this version.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project, rerun the latest [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor; it preserves existing profiles and friend links while removing the one-friend limit. **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## App notifications

Choose between five bottle designs in **Customize**; the choice is saved on that device. Soft ambient music is enabled where the device permits playback; if autoplay is blocked, tap the music button in the header. Water reminders and friend-completion notifications use the notification API and require permission; reminders fire while Aqua Bond is open. Background push delivery requires a push service and server-side credentials, which are not included.

## Android app

The Android package is an installable Capacitor app with bundled web assets. It is not a Play Store release or a fully native UI: the interface runs in the app's Android WebView, while Supabase-backed profiles, friends, and progress use the internet. Each site deployment builds a test APK and hosts it directly at `/aqua-bond.apk`. Android versions check for updates and show a prompt when a newer build is available. The prompt opens the direct APK download; Android still requires you to approve installation. These debug-signed test builds are not production releases; if Android rejects an update, uninstall the old build before installing the new one. A production Android release needs a stable signing key. The app needs internet access to sync data.

To build locally, install the Android SDK and Java 21, then run:

```sh
npm run build:android
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The deployment workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from its configured variables. The Supabase publishable key is included in client builds by design; never use a `service_role` or secret key in this frontend. iOS builds and App Store distribution are not configured.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## Website deployment

The website and Android test package are built and deployed automatically from the `main` branch. The deployment workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project's Actions variables. Database access must remain protected by the row-level security policies in `supabase/schema.sql`.
