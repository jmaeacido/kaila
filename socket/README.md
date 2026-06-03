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

## Media Uploads

Service requests and provider completion proofs accept optional JPG, PNG, WebP, MP4, or WebM attachments. The server stores up to 3 files per stage with a 10 MB limit per file in `socket/uploads` and serves them through opaque `/media/:id` URLs.

## Audio Calls

Active confirmed-job conversations support peer-to-peer WebRTC audio and video calls. Socket.IO relays authorized call signaling only between the confirmed client and provider. Serve the PWA over HTTPS outside local development.

The API exposes `/api/rtc-config` so browsers can load ICE servers before starting or answering a call. By default KAILA uses Google's public STUN server. Configure TURN before production rollout or phone testing across restrictive mobile networks:

```env
KAILA_TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
KAILA_TURN_USERNAME=turn-user
KAILA_TURN_CREDENTIAL=turn-password
```

For advanced setups, set `KAILA_RTC_ICE_SERVERS` to a JSON array of `RTCIceServer` objects.

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
