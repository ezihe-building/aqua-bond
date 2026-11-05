# Aqua Bond

Aqua Bond has a premium introduction website and a separate Android hydration app. The website is for learning about Aqua Bond and downloading the app; the tracker runs in the installed app, not as a website page. The tracker supports saved history, invite-code friend connections, and shared progress. No signup or login is required. It creates a private anonymous profile automatically and keeps its session on the current device.

## Run locally

1. Install dependencies with `npm ci`.
2. Run `npm run dev` to preview the public landing page. It does not need Supabase environment variables.
3. To build and test the Android tracker, enable **Authentication → Sign In / Providers → Allow anonymous sign-ins** in Supabase, copy `.env.example` to `.env`, add the project URL and publishable (anon) key from **Project Settings → API**, then run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor. For an existing Supabase project, run [`supabase/migrations/20261105_drink_cooldown.sql`](./supabase/migrations/20261105_drink_cooldown.sql) to enable drink limits.

The first launch of the Android app creates a profile automatically. Profiles are private to the device that created them; clearing app data or switching devices may make an anonymous profile inaccessible. Share your invite code and enter other people's codes in **You** to connect; connected friends can see each other's hydration progress. There is no email signup, login, password recovery, or profile transfer in this version.

The Supabase schema enables row-level security for profiles, friend links, daily challenges, and water logs. The `connect_friend` function validates invite codes without making other users' profiles publicly searchable. To update an existing project with the one-hour drink timer, run [`supabase/migrations/20261105_drink_cooldown.sql`](./supabase/migrations/20261105_drink_cooldown.sql) in the Supabase SQL editor. New projects should run [`supabase/schema.sql`](./supabase/schema.sql). **Never put a Supabase `service_role` or secret key in this app.** Only the publishable/anon key belongs in `.env`; database writes are restricted by the SQL policies and server functions.

## App notifications

Choose between five bottle designs in **Customize**; the choice is saved on that device. The app allows one drink log per hour, limits each drink to 500 ml, and schedules a local reminder for the next drink when notifications are allowed. The one-hour rule is enforced by Supabase; run the cooldown migration above before deploying the updated app. Soft ambient music attempts to start on launch; browser autoplay restrictions may require a tap. The music file must be placed at `public/relaxing-music.mp3`.

## Android app

The Android package is an installable Capacitor app with bundled web assets. It is not a Play Store release or a fully native UI: the interface runs in the app's Android WebView, while Supabase-backed profiles, friends, and progress use the internet. Each GitHub Pages workflow run builds a test APK and hosts it directly at `/aqua-bond.apk`; Vercel deploys the landing website only and links to that APK. Android versions check for updates and show a prompt when a newer build is available. The prompt opens the direct APK download; Android still requires you to approve installation. These debug-signed test builds are not production releases; if Android rejects an update, uninstall the old build before installing the new one. A production Android release needs a stable signing key. The app needs internet access to sync data.

To build locally, install the Android SDK and Java 21, then run:

```sh
npm run build:android
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The deployment workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from its configured variables. The Supabase publishable key is included in client builds by design; never use a `service_role` or secret key in this frontend. iOS builds and App Store distribution are not configured; an iPhone download can be added after an iOS build is signed and released through Apple's App Store.

## Build

Run `npm run build` to type-check and create the production app in `dist/`.

## GitHub Pages deployment

The website and Android test package are built and deployed automatically from the `main` branch. The deployment workflow reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project's Actions variables. Database access must remain protected by the row-level security policies in `supabase/schema.sql`.

### Deploy the website to Vercel

The public website is a static Vite landing page. Vercel serves only the website; it does not build the Android app or run the tracker inside the browser. The Android download remains hosted at the direct APK URL produced by the GitHub Pages workflow.

**Start deployment:** [Open Vercel's New Project page](https://vercel.com/new). Sign in (or create a Vercel account), then use the steps below to import this repository. Vercel must be authorized to access the GitHub repository. If prompted to install the Vercel GitHub App, approve access to `ezihe-building/aqua-bond`.

1. In Vercel, click **Add New…** → **Project** (or **Import Project** if that is the label shown).
2. Under **Import Git Repository**, find `ezihe-building/aqua-bond`. If it is not listed, click **Adjust GitHub App Permissions**, grant Vercel access to this repository in GitHub, and return to the import screen.
3. Click **Import** next to `ezihe-building/aqua-bond`.
4. On **Configure Project**, keep the **Root Directory** as `./`. Leave the build settings at the detected/default values; [`vercel.json`](./vercel.json) already specifies Vite, `npm ci`, `npm run build`, and `dist`. Do not add environment variables; this landing-page build does not need Supabase credentials.
5. Click **Deploy** and wait for Vercel to finish the build. When Vercel shows the success screen, click **Visit** to open the live site.

The repository's [`vercel.json`](./vercel.json) also pins Node.js 22 and points the Android download button to the existing public APK. No Supabase environment variables are needed to build the landing page. Vercel deploys the website only; it does not build the Android app or run the tracker in a browser.

For manual setup in Vercel, import `ezihe-building/aqua-bond` from GitHub and use these Project Settings → Build and Development Settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `.` (repository root) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 22.x |

Keep the `VITE_ANDROID_DOWNLOAD_URL` value in `vercel.json` pointed at the current, publicly reachable APK. Vercel does not build that APK. The configured URL is the GitHub Pages file-download endpoint (the download itself does not open the repository). If the APK hosting location changes, update that value and redeploy. The Vercel build uses `/` as its asset base and defaults to the direct APK URL; GitHub Pages continues to use `/aqua-bond/` and its same-origin APK.

After the first successful deployment, Vercel assigns a `*.vercel.app` URL. Add a custom domain in the Vercel project’s **Settings → Domains** if desired. Each later push to the connected production branch creates a deployment; pull requests receive preview deployments. If a deployment fails, open the Vercel project → **Deployments** → failed deployment → **Build Logs**. Confirm that Vercel is using Node 22.x and that the project root and output directory match the table above. No build-time secret is required for this website.
