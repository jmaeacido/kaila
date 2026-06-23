# KAILA

KAILA is a local services marketplace concept for helping clients find trusted local service providers while helping skilled workers become more visible.

This repository contains the KAILA founder-grade planning package: business proposal, validation plan, operational playbooks, MVP specification, pitch material, financial model, and field forms.

## Mobile-First MVP

The first KAILA web app version is available at the repository root:

- `index.html` - mobile-first MVP interface
- `style.css` - responsive app styling
- `app.js` - SweetAlert2-powered auth, role-based flows, pilot board, and real-time events
- `socket/` - KAILA-owned Socket.IO server

Current MVP screens:

- Landing page
- Username-based registration for Client and Provider roles
- Login page
- Authenticated compact dashboard
- Admin-created Customer Service role with a support desk, client/provider direct messaging, and request triage visibility
- Katabang AI assistant for KAILA questions, guided walkthroughs, tutorials, and support handoff guidance
- In-app Privacy Policy, Terms of Service, Contact Support, report user/job, block user, and account deletion controls

Real-time MVP events:

- Job request created
- Offer sent
- Counter-offer sent
- Job confirmed
- Job started
- Provider marked job done with proof notes
- Optional request and completion photo/video attachments: JPG, PNG, WebP, MP4, or WebM; up to 3 files per stage and 10 MB per file
- Client confirmed completion
- Confirmed-job messaging with live updates, typing indicators, room presence, reactions, and archived read-only transcripts
- Peer-to-peer audio and optional video calls inside active confirmed-job conversations, with ringing tones, front/rear mobile camera switching, automatic audio-only fallback on sustained slow connections, and immediate offline-recipient handling
- Payment released independent of ratings
- Client requested revision/correction
- Client rated provider
- Provider rated client
- Blind mutual ratings revealed after both sides rate or rating window expires
- Job cancelled
- Job disputed
- Admin resolved dispute
- Provider profile saved
- Team activity note
- Customer Service direct support for clients and providers
- Safety reports for users and jobs
- User blocks that disable direct messages and calls
- Self-service client/provider account deletion with profile/contact anonymization
- Native Android push notifications for job, offer, message, missed-call, and incoming-call events

Run the web app locally:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`.

### Native Android App

KAILA can also be packaged as a native Android app with Capacitor. The native
app bundles the existing PWA files from the repository root and uses the live
HTTPS API/socket endpoint by default:

```text
https://kaila-app.com/kaila-api
```

Prepare and sync the Android project:

```bash
npm install
npm run native:sync
```

Use `npm run native:sync` after frontend changes. Plain `npx cap sync android`
copies the already-prepared `native-www/` folder and can package stale web
files if `native-www/` was not refreshed first.

Open the project in Android Studio:

```bash
npm run native:android
```

Build a debug APK from the command line:

```bash
npm run native:sync
cd android
./gradlew assembleDebug
```

The Gradle build also runs `scripts/prepare-capacitor-web.js` before packaging,
so `./gradlew assembleDebug` refreshes Android web assets as a final guard.

The generated APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`.

The native app checks `/api/mobile-update` on launch and prompts Android users
when the backend reports a higher APK version code than the installed app. If a
user taps Later, the same update prompt is held back until the next day.
KAILA's current manual APK distribution link is stored in
`socket/mobile-update.json`; keep it pointed at the stable Google Drive APK
file. Public update checks are metadata-only and do not expose APK URLs. The
native app sends `X-KAILA-Native-Update: 1`, receives a signed
`/api/mobile-update/apk` link, and the backend redirects that request to a
fresh direct Google Drive download for the configured file. Every
Gradle build creates a fresh Android `versionCode` automatically by
using the greater of the current epoch seconds or the previous
`latestVersionCode + 1`, then rewrites that manifest. This means each
`./gradlew assembleDebug` run publishes a higher version than the last tracked
manifest. The backend reads the manifest on every update check, so the normal
release flow is: build the APK, replace the old Drive file with the new APK by
using Google Drive's version replacement for that same file ID, commit the
updated `socket/mobile-update.json`, pull it on the server, and restart the
Node service. If a new Drive file is uploaded instead, update `apkUrl` to the
new file link. Optional `KAILA_VERSION_CODE` / `KAILA_VERSION_NAME` values
still work for manual release numbering, but `KAILA_VERSION_CODE` must be
higher than the current tracked manifest value.

Build a Play Store upload bundle:

```bash
npm run native:bundle
```

For a signed release bundle, provide the keystore values through environment
variables or matching Gradle properties before running the bundle command:

```bash
export KAILA_RELEASE_STORE_FILE=/secure/path/kaila-release.keystore
export KAILA_RELEASE_STORE_PASSWORD=...
export KAILA_RELEASE_KEY_ALIAS=...
export KAILA_RELEASE_KEY_PASSWORD=...
npm run native:bundle
```

The Play-uploadable AAB is copied to
`android/app/build/outputs/bundle/kaila/release/`.

### Play Store Readiness

Repository-side release hardening:

- Android package id is `com.kaila.marketplace`.
- Target SDK is 36 and minimum SDK is 24.
- Android backup/device-transfer extraction is disabled for app data.
- Camera and microphone are declared as optional hardware features.
- Full-screen notification permission is reserved for incoming KAILA audio/video
  calls; job alerts use high-priority notifications without full-screen launch.
- Public legal pages are available at `https://kaila-app.com/?route=privacy`,
  `https://kaila-app.com/?route=terms`, and
  `https://kaila-app.com/?route=support`.

Play Console items still required outside this repository:

- Create and securely store the upload keystore, or use Play App Signing with an
  upload key.
- Complete the Data safety form for account details, contact details, user
  content/messages/media, ratings, reports/blocks, device identifiers/push
  tokens, diagnostics, camera, microphone, and notifications.
- Add the privacy-policy URL:
  `https://kaila-app.com/?route=privacy`.
- Complete content rating and target audience declarations for a local-services
  marketplace.
- Complete the `USE_FULL_SCREEN_INTENT` declaration for incoming audio/video
  calls if Google Play requests it.
- Upload required store listing assets: app icon, feature graphic, phone
  screenshots, short description, full description, support contact, and release
  notes.

Native packaging files:

- `capacitor.config.json` - Capacitor app id, app name, and bundled web path.
- `scripts/prepare-capacitor-web.js` - copies the root PWA shell into the
  ignored `native-www/` bundle directory.
- `android/` - generated Android project.

Run `npm run native:sync` after changing `index.html`, `style.css`, `app.js`,
`sw.js`, `manifest.webmanifest`, or files in `assets/`.

On this server, nginx serves KAILA over HTTPS at:

```text
https://kaila-app.com/
```

The nginx site config lives in `deploy/nginx/kaila-https.conf` and is installed at `/etc/nginx/sites-available/kaila`. It serves the static PWA from `/var/www/kaila` and reverse-proxies API, media, and Socket.IO traffic from `https://kaila-app.com/kaila-api/` to the Node service on `http://127.0.0.1:6002`.

Run KAILA's MySQL-backed API/socket:

```bash
cd socket
npm install
npm start
```

Default socket URL on HTTP: `http://<same-host-as-the-web-app>:6002`

Default socket URL on HTTPS: `https://<same-host-as-the-web-app>/kaila-api`

For example, if the app is opened from another device at `http://crg-co1-23-0028/kaila/`, the browser connects to `http://crg-co1-23-0028:6002`.

### Android Audio/Video-Call Testing

Android Chrome does not expose microphone or camera capture to a page opened from a LAN `http://` URL. An address such as `http://192.168.1.10/kaila/` can load the app, but audio and video calls cannot work from it.

For phone testing, expose both the static PWA and the Node socket/API service through HTTPS. The Laragon certificate on this workstation covers `localhost` and `crg-co2-24-9-05`, but an Android device must also resolve that hostname and trust the certificate. An HTTPS tunnel is usually simpler for phone testing. For a LAN-only setup, install a trusted development certificate on the phone and include the LAN hostname or IP address in its subject alternative names.

For deployment:

- Serve the root folder as a static site.
- Run `socket/` as a Node service.
- Run MySQL and configure `socket/.env`.
- Set `KAILA_SOCKET_BEARER_TOKEN` in `socket/.env`.
- Set `GROQ_API_KEY` in `socket/.env` if Katabang, AI-assisted Decision Signal prefilling, and dashboard analytics should be enabled.
- Optional: set `KAILA_GOOGLE_CLIENT_ID`, `KAILA_FACEBOOK_APP_ID`, and `KAILA_FACEBOOK_APP_SECRET` in `socket/.env` to enable Google/Facebook login and signup.
- Update the socket URL in the app if the deployed socket URL changes.
- Serve the PWA over HTTPS so browsers allow microphone and camera access outside local development.
- Configure a TURN server before production rollout if calls must work reliably across restrictive mobile networks.

Default local MySQL settings:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kaila_mvp
```

The Node service creates the `kaila_mvp` database and required tables automatically.

## Package Contents

All documents are inside `KAILA_Founder_Grade_Package/`.

| File | Purpose |
| --- | --- |
| `00 READ ME KAILA Founder Package.pdf` | Package index, usage guide, and recommended reading order. |
| `01 Master Business Proposal.pdf` | Full business case, problem, market, model, strategy, risks, roadmap, TOC, and terms. |
| `01 Master Business Proposal.docx` | Editable Word version of the master business proposal. |
| `02 Business Model Canvas and Lean Canvas.pdf` | Business Model Canvas and Lean Canvas in structured table format. |
| `03 Market Validation and Feasibility Study.pdf` | Research plan, interview guide, pilot design, go/no-go criteria, TOC, and terms. |
| `04 Provider Recruitment and Operations Playbook.pdf` | Provider recruitment, onboarding, operations, dispute handling, and recruitment targets. |
| `05 MVP Functional Specification.pdf` | MVP scope, user roles, flows, modules, status model, and database concept. |
| `06 Investor Style Pitch Deck.pdf` | Slide-style summary for early founder or investor discussions. |
| `07 Founders Agreement Discussion Draft.pdf` | Non-legal discussion draft for founder roles, ownership, contributions, and governance. |
| `08_Three_Year_Financial_Projection.xlsx` | Editable financial assumptions, projections, annual summary, unit economics, and terms. |
| `09 Field Forms Pack.pdf` | Printable/copyable forms for client surveys, provider signup, interviews, job logs, and meeting notes. |
| `KAILA Business Plan.pdf` | Concise founder and co-founder business plan. |
| `KAILA Founder Presentation/` | Online HTML slideshow and downloadable PowerPoint covering files `01` through `09`. |

## Recommended Reading Order

1. `00 READ ME KAILA Founder Package.pdf`
2. `01 Master Business Proposal.pdf`
3. `02 Business Model Canvas and Lean Canvas.pdf`
4. `03 Market Validation and Feasibility Study.pdf`
5. `04 Provider Recruitment and Operations Playbook.pdf`
6. `05 MVP Functional Specification.pdf`
7. `08_Three_Year_Financial_Projection.xlsx`
8. Remaining supporting documents as needed

## Notes

- Several PDFs include a `Definition of Terms` section for shared vocabulary.
- Longer PDFs include a formal cover page and Table of Contents.
- The `KAILA Founder Presentation/` folder can be opened locally through `index.html`; it also includes a downloadable `.pptx` version.
- The financial projection is an editable planning model, not a promise of results.
- The founders agreement draft is for discussion only and is not legal advice.
