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
