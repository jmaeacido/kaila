# KAILA Socket

Project-owned Socket.IO server for the first KAILA mobile-first MVP.

## Start

```bash
npm install
npm start
```

Default URL: `http://localhost:6002`

## Message Encryption

Job-message content is encrypted at rest with AES-256-GCM. Set `KAILA_MESSAGE_ENCRYPTION_KEY` in `.env` to a private 64-character hexadecimal value and keep it stable across restarts. Losing or changing this key makes existing transcripts unreadable.

## Roles

Public registration creates only Client and Provider accounts. Admin can also create Ops and Customer Service accounts. Customer Service accounts can view support context, message clients/providers directly, and join accepted job conversations for assistance without receiving client/provider job-action permissions.

## Safety, Reports, and Account Deletion

The service stores user and job reports in `moderation_reports` for Admin and Customer Service review. User blocks are stored in `user_blocks`; blocked pairs cannot open direct messages or direct calls. Clients and providers can delete their own accounts through `/api/account`, which removes login access, push tokens, and profile/contact details while retaining operational job, message, report, and rating history.

## Media Uploads

Service requests and provider completion proofs accept optional JPG, PNG, WebP, MP4, or WebM attachments. The server stores up to 3 files per stage with a 10 MB limit per file in `socket/uploads` and serves them through opaque `/media/:id` URLs.

## Groq AI

Set `GROQ_API_KEY` in `socket/.env` to enable AI-assisted validation and dashboard analytics. The browser calls KAILA's API only; the Groq key stays on the Node service.

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

## Audio Calls

Active confirmed-job conversations support peer-to-peer WebRTC audio and video calls. Socket.IO relays authorized call signaling only between the confirmed client and provider. Serve the PWA over HTTPS outside local development.

The API exposes `/api/rtc-config` so browsers can load ICE servers before starting or answering a call. By default KAILA uses Google's public STUN server. Configure TURN before production rollout or phone testing across restrictive mobile networks:

```env
KAILA_TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
KAILA_TURN_USERNAME=turn-user
KAILA_TURN_CREDENTIAL=turn-password
```

For advanced setups, set `KAILA_RTC_ICE_SERVERS` to a JSON array of `RTCIceServer` objects.

## Push Notifications

Native Android notifications use Firebase Cloud Messaging. Put the Firebase Android
`google-services.json` file in `android/app/google-services.json`, then configure
the Node service with a Firebase Admin service account:

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\firebase-service-account.json
# or
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

The app registers device tokens through `/api/push-token`. The server sends high
priority FCM data messages for job requests, offers, messages, missed calls, and
incoming call invites. The Android app has a native Firebase messaging service so
closed/backgrounded apps can still show persistent notifications and full-screen
incoming call alerts when Android permits full-screen intent.

## Android APK Update Prompt

The API exposes `/api/mobile-update` for the native Android app. The app compares
that response with its installed `versionCode` on launch and prompts users to
download the new APK when the backend value is higher. If the user taps Later,
the same update prompt is held back until the next day.

```env
KAILA_ANDROID_APK_URL=https://drive.google.com/file/d/1FG0o6--zWQpmqYkqszSSDJVuivwzf89L/view?usp=drive_link
KAILA_ANDROID_RELEASE_NOTES=
```

Keep `KAILA_ANDROID_APK_URL` pointed at the stable Google Drive APK file. Each
Android Gradle build auto-generates a fresh `versionCode` and `versionName`, then
writes them to ignored `socket/mobile-update.json`. `/api/mobile-update` reads
that file on every request, so replacing the APK in Drive with the same link is
enough as long as the build was created from this project. If the generated JSON
is missing, the endpoint falls back to optional
`KAILA_ANDROID_LATEST_VERSION_CODE` and `KAILA_ANDROID_LATEST_VERSION_NAME`
values from `socket/.env`.

## Events

Clients join the shared MVP pilot room:

```js
socket.emit("subscribe", "kaila-mvp");
```

Clients broadcast real-time marketplace events:

```js
socket.emit("broadcast-event", {
  channel: "kaila-mvp",
  event: "kaila.request.created",
  data: { request },
  socket_token: "kaila_mvp_secret_token"
});
```

HTTP broadcasts are also available:

```bash
curl -X POST http://localhost:6002/broadcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer kaila_mvp_secret_token" \
  -d "{\"channel\":\"kaila-mvp\",\"event\":\"kaila.activity\",\"data\":{\"title\":\"hello\",\"detail\":\"socket works\"}}"
```
