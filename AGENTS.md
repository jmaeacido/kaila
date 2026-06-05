# KAILA Repository Guide

## Product Shape

KAILA is a mobile-first local-services marketplace MVP plus a separate founder
planning package. The runnable app is intentionally small: a static browser PWA
at the repository root, a Capacitor Android wrapper generated from that PWA,
and one Node.js/MySQL service in `socket/`.

## Runtime Application

| Path | Purpose |
| --- | --- |
| `index.html` | Single-page app shell. Contains landing, registration, login, dashboard, tab panes, and the live socket panel. Loads Bootstrap, SweetAlert2, SheetJS, and `app.js` from CDN/local script tags. |
| `style.css` | All root MVP styling, including responsive layout, themes, dashboard cards, chat, and audio/video call UI. |
| `app.js` | Browser application logic. Owns client-side state, routing, API calls, rendering, registration/login, role-based dashboard actions, requests, offers, ratings, chat, Socket.IO handling, and WebRTC audio/video calls. |
| `sw.js` | PWA service worker. Caches the app shell and refreshes JS/CSS/manifest assets from the network when available. Bump `CACHE_NAME` after cache-sensitive shell changes. |
| `manifest.webmanifest` | Installable PWA metadata and icon declarations. |
| `assets/` | Brand images, PWA icons, preview artwork, and `Gingoog City PSGC.xlsx`, which `app.js` reads with SheetJS for address options. |
| `capacitor.config.json` | Native mobile wrapper configuration. Uses `native-www/` as the bundled web output. |
| `scripts/prepare-capacitor-web.js` | Copies the root PWA shell and assets into ignored `native-www/` for Capacitor sync/build. |
| `android/` | Generated Capacitor Android project for building APK/AAB packages from the existing PWA. |

The frontend has no build step and no framework. Prefer extending the existing
plain JavaScript and `data-*` selector patterns unless a broader rewrite is
explicitly requested.

For native Android packaging, run `npm run native:sync` after frontend changes.
Plain `npx cap sync android` can package stale files if ignored `native-www/`
was not refreshed first. The Android Gradle build also runs
`scripts/prepare-capacitor-web.js` before packaging as a final guard. The Android
app defaults to `https://kaila-app.duckdns.org/kaila-api` when loaded from the
Capacitor origin, while the browser PWA keeps its existing same-host HTTP/HTTPS
defaults.

## Backend Service

| Path | Purpose |
| --- | --- |
| `socket/server.js` | Express API, Socket.IO server, MySQL schema bootstrap/migrations, attachment storage, encrypted job-message storage, scheduled auto-confirmation, rating-window expiry, and WebRTC signaling relay. |
| `socket/package.json` | Node service dependencies and `npm start` script. |
| `socket/.env.example` | Local configuration template. Keep actual values in ignored `socket/.env`. |
| `socket/README.md` | Service-specific startup, upload, encryption, and event notes. |

The Node service creates the `kaila_mvp` database and required tables on
startup. The active schema is defined in `socket/server.js`; treat any local SQL
dump as a snapshot, not as the source of truth.

Public registration is limited to `client` and `provider`. Admin-created staff
roles include `ops` for validation work and `customer_service` for support desk
triage and direct client/provider assistance.

Safety and legal controls are part of the runtime MVP. The frontend includes
Privacy Policy, Terms of Service, Contact Support, report user/job, block user,
and account deletion controls. The backend persists reports in
`moderation_reports`, blocks in `user_blocks`, and account deletion as a soft
delete/anonymization on `users.deleted_at` so operational job history remains
available for disputes, ratings, and safety review.

Important environment settings:

- `PORT` defaults to `6002`.
- `KAILA_SOCKET_BEARER_TOKEN` must be changed before deployment.
- `KAILA_MESSAGE_ENCRYPTION_KEY` must be a stable private 64-character
  hexadecimal value. Changing or losing it makes stored chat transcripts
  unreadable.
- `GROQ_API_KEY` enables server-side AI suggestions for validation Decision
  Signal prefilling and dashboard analytics. Keep it in ignored `socket/.env`.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` configure MySQL.

## Runtime Data

| Path | Purpose |
| --- | --- |
| `uploads/` | Ignored user-uploaded request, completion, and dispute media. |
| `profile-photos/` | Ignored user-uploaded profile images. |
| `kaila_mvp.sql` | Local ignored database dump when present. Do not edit it for schema changes. |
| `native-www/` | Ignored generated Capacitor web bundle. Recreate it with `npm run native:prepare` or `npm run native:sync`. |

Do not commit runtime uploads, local database dumps, secrets, or `node_modules/`.

## Reference Package

`KAILA_Founder_Grade_Package/` contains business proposals, playbooks,
financial spreadsheets, PDFs, PowerPoint files, HTML presentations, generated
slide images, and investor-package references. It is documentation and pitch
material, not part of the live MVP runtime. Avoid touching it unless the request
is specifically about founder documents or presentations.

## Local Development

Start the backend from `socket/`:

```bash
npm install
npm start
```

Serve the root PWA separately:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000`. On the configured Laragon workstation,
`https://localhost/kaila/` serves the frontend and proxies API/Socket.IO traffic
through `https://localhost/kaila-api`.

Use HTTPS for phone audio/video-call testing because browser media capture is
not available from ordinary LAN `http://` origins.

## Editing Checklist

- For UI markup, inspect `index.html`, `style.css`, and the corresponding
  renderer or handler in `app.js`.
- For API behavior, persistence, authorization, or real-time events, inspect
  both `app.js` and `socket/server.js`.
- For PWA caching issues, inspect `sw.js` and the versioned asset query strings
  in `index.html`.
- Keep user uploads and secrets out of version control.
- Update `README.md`, `socket/README.md`, and this guide when architecture or
  startup behavior changes.
