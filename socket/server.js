const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), quiet: true });

const express = require("express");
const http = require("http");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = Number(process.env.PORT || 6002);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const CHANNEL = "kaila-mvp";
const SOCKET_TOKEN = sanitizeToken(process.env.KAILA_SOCKET_BEARER_TOKEN || "kaila_mvp_secret_token");
const MESSAGE_ENCRYPTION_KEY = parseMessageEncryptionKey(process.env.KAILA_MESSAGE_ENCRYPTION_KEY);
const AUTO_CONFIRM_HOURS = Number(process.env.KAILA_AUTO_CONFIRM_HOURS || 48);
const RATING_WINDOW_DAYS = Number(process.env.KAILA_RATING_WINDOW_DAYS || 7);
const UPLOAD_DIR = path.resolve(__dirname, "uploads");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_STAGE = 3;
const ALLOWED_MEDIA_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);
const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kaila_mvp",
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;
const conversationPresence = new Map();

app.use(cors());
app.use(express.json({ limit: "35mb" }));

function sanitizeToken(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function parseMessageEncryptionKey(value) {
  const clean = sanitizeToken(value);
  if (!/^[a-f0-9]{64}$/i.test(clean)) throw new Error("KAILA_MESSAGE_ENCRYPTION_KEY must be a 64-character hexadecimal value");
  return Buffer.from(clean, "hex");
}

function encryptMessage(detail, messageId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", MESSAGE_ENCRYPTION_KEY, iv);
  cipher.setAAD(Buffer.from(messageId));
  const encrypted = Buffer.concat([cipher.update(String(detail), "utf8"), cipher.final()]);
  return ["enc", "v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

function decryptMessage(detail, messageId) {
  const stored = String(detail || "");
  if (!stored.startsWith("enc:v1:")) return stored;
  const [, , iv, tag, encrypted] = stored.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", MESSAGE_ENCRYPTION_KEY, Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(messageId));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}`;
}

function decodeAttachment(attachment) {
  const match = String(attachment?.dataUrl || "").match(/^data:([^;,]+);base64,([a-z0-9+/=\r\n]+)$/i);
  if (!match || !ALLOWED_MEDIA_TYPES.has(match[1])) throw new Error("Only JPG, PNG, WebP, MP4, or WebM files are allowed");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_ATTACHMENT_BYTES) throw new Error("Each attachment must be between 1 byte and 10 MB");
  if (!matchesMediaSignature(match[1], buffer)) throw new Error("Attachment content does not match its media type");
  return { buffer, mimeType: match[1], extension: ALLOWED_MEDIA_TYPES.get(match[1]) };
}

function matchesMediaSignature(mimeType, buffer) {
  if (mimeType === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (mimeType === "video/mp4") return buffer.subarray(4, 8).toString() === "ftyp";
  if (mimeType === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

function sanitizedAttachmentName(name, extension, fallbackId = createId()) {
  const source = path.parse(String(name || "attachment")).name;
  const slug = source
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "attachment";
  const suffix = String(fallbackId).replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return `${slug}-${suffix}${extension}`;
}

function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt] = String(stored || "").split(":");
  return passwordHash(password, salt) === stored;
}

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function futureMysqlHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function futureMysqlDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, password, email, ...safe } = user;
  return safe;
}

async function initializeDatabase() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const bootstrap = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    multipleStatements: true,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await bootstrap.end();

  pool = mysql.createPool(DB_CONFIG);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      username VARCHAR(80) NOT NULL UNIQUE,
      email VARCHAR(190) NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('client','provider','admin') NOT NULL,
      area VARCHAR(190) NOT NULL,
      category VARCHAR(160) NULL,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("users", "username", "VARCHAR(80) NULL");
  await backfillUsernames();
  await ensureIndex("users", "users_username_unique", "username", true);
  await pool.query("ALTER TABLE users MODIFY COLUMN username VARCHAR(80) NOT NULL");
  await pool.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(190) NULL");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS providers (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      name VARCHAR(160) NOT NULL,
      category VARCHAR(160) NOT NULL,
      area VARCHAR(190) NOT NULL,
      availability VARCHAR(80) NOT NULL DEFAULT 'Available',
      skills TEXT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY providers_user_unique (user_id),
      CONSTRAINT providers_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(64) PRIMARY KEY,
      client_id VARCHAR(64) NOT NULL,
      client_name VARCHAR(160) NOT NULL,
      category VARCHAR(160) NOT NULL,
      urgency VARCHAR(80) NOT NULL,
      area VARCHAR(190) NOT NULL,
      budget VARCHAR(80) NOT NULL,
      details TEXT NOT NULL,
      status VARCHAR(80) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      confirmed_at DATETIME NULL,
      provider_done_at DATETIME NULL,
      auto_confirm_at DATETIME NULL,
      payment_released_at DATETIME NULL,
      rating_deadline_at DATETIME NULL,
      proof_note TEXT NULL,
      revision_note TEXT NULL,
      rating_score TINYINT NULL,
      rating_note TEXT NULL,
      client_rating_score TINYINT NULL,
      client_rating_note TEXT NULL,
      client_rated_at DATETIME NULL,
      provider_rating_score TINYINT NULL,
      provider_rating_note TEXT NULL,
      provider_rated_at DATETIME NULL,
      dispute_note TEXT NULL,
      accepted_provider_id VARCHAR(64) NULL,
      CONSTRAINT requests_client_fk FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("requests", "rating_score", "TINYINT NULL");
  await ensureColumn("requests", "rating_note", "TEXT NULL");
  await ensureColumn("requests", "dispute_note", "TEXT NULL");
  await ensureColumn("requests", "provider_done_at", "DATETIME NULL");
  await ensureColumn("requests", "auto_confirm_at", "DATETIME NULL");
  await ensureColumn("requests", "payment_released_at", "DATETIME NULL");
  await ensureColumn("requests", "rating_deadline_at", "DATETIME NULL");
  await ensureColumn("requests", "proof_note", "TEXT NULL");
  await ensureColumn("requests", "revision_note", "TEXT NULL");
  await ensureColumn("requests", "client_rating_score", "TINYINT NULL");
  await ensureColumn("requests", "client_rating_note", "TEXT NULL");
  await ensureColumn("requests", "client_rated_at", "DATETIME NULL");
  await ensureColumn("requests", "provider_rating_score", "TINYINT NULL");
  await ensureColumn("requests", "provider_rating_note", "TEXT NULL");
  await ensureColumn("requests", "provider_rated_at", "DATETIME NULL");
  await ensureColumn("requests", "accepted_provider_id", "VARCHAR(64) NULL");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offers (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      type ENUM('offer','counter') NOT NULL,
      provider_id VARCHAR(64) NOT NULL,
      provider_name VARCHAR(160) NOT NULL,
      amount VARCHAR(80) NOT NULL,
      schedule VARCHAR(160) NULL,
      notes TEXT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT offers_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT offers_provider_fk FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_attachments (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      stage ENUM('request','completion') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL,
      size_bytes INT NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT request_attachments_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await sanitizeStoredAttachmentNames();
  await cleanupOrphanUploads();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_passes (
      request_id VARCHAR(64) NOT NULL,
      provider_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (request_id, provider_id),
      CONSTRAINT request_passes_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT request_passes_provider_fk FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    UPDATE requests AS request
    JOIN offers AS offer ON offer.id = (
      SELECT latest.id
      FROM offers AS latest
      WHERE latest.request_id = request.id
      ORDER BY latest.created_at DESC
      LIMIT 1
    )
    SET request.accepted_provider_id = offer.provider_id
    WHERE request.accepted_provider_id IS NULL
      AND request.confirmed_at IS NOT NULL
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      detail TEXT NOT NULL,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_messages (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      sender_id VARCHAR(64) NOT NULL,
      sender_name VARCHAR(160) NOT NULL,
      detail TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT job_messages_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT job_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await encryptExistingMessages();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_message_reactions (
      message_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      reaction VARCHAR(40) NOT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (message_id, user_id, reaction),
      CONSTRAINT job_message_reactions_message_fk FOREIGN KEY (message_id) REFERENCES job_messages(id) ON DELETE CASCADE,
      CONSTRAINT job_message_reactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [DB_CONFIG.database, table, column]
  );
  if (!rows.length) await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function ensureIndex(table, index, column, unique = false) {
  const [rows] = await pool.query(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
    [DB_CONFIG.database, table, index]
  );
  if (!rows.length) await pool.query(`ALTER TABLE \`${table}\` ADD ${unique ? "UNIQUE " : ""}INDEX \`${index}\` (\`${column}\`)`);
}

async function backfillUsernames() {
  const [rows] = await pool.query("SELECT id, name, email, username FROM users ORDER BY created_at ASC");
  const used = new Set(rows.map((row) => row.username).filter(Boolean));
  for (const row of rows) {
    if (row.username) continue;
    const source = String(row.email || row.name || "user").split("@")[0];
    const root = source.toLowerCase().replace(/[^a-z0-9._-]+/g, "_").replace(/^[_\W]+|[_\W]+$/g, "") || "user";
    let username = root.slice(0, 40);
    let suffix = 2;
    while (used.has(username)) username = `${root.slice(0, 36)}_${suffix++}`;
    used.add(username);
    await pool.query("UPDATE users SET username = ? WHERE id = ?", [username, row.id]);
  }
}

async function encryptExistingMessages() {
  const [rows] = await pool.query("SELECT id, detail FROM job_messages");
  for (const row of rows) {
    if (String(row.detail || "").startsWith("enc:v1:")) {
      decryptMessage(row.detail, row.id);
      continue;
    }
    await pool.query("UPDATE job_messages SET detail = ? WHERE id = ?", [encryptMessage(row.detail, row.id), row.id]);
  }
}

function mapUser(row) {
  return row ? {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    area: row.area,
    category: row.category || "",
    createdAt: row.created_at,
  } : null;
}

function mapProvider(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    area: row.area,
    availability: row.availability,
    skills: row.skills || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOffer(row) {
  return {
    id: row.id,
    type: row.type,
    providerId: row.provider_id,
    providerName: row.provider_name,
    amount: row.amount,
    schedule: row.schedule || "",
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function mapAttachment(row) {
  return {
    id: row.id,
    stage: row.stage,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    url: `/media/${encodeURIComponent(row.id)}`,
    createdAt: row.created_at,
  };
}

async function sanitizeStoredAttachmentNames() {
  const [rows] = await pool.query("SELECT id, original_name, mime_type FROM request_attachments");
  for (const row of rows) {
    const extension = ALLOWED_MEDIA_TYPES.get(row.mime_type);
    if (!extension) continue;
    const sanitized = sanitizedAttachmentName(row.original_name, extension, row.id);
    if (sanitized !== row.original_name) await pool.query("UPDATE request_attachments SET original_name = ? WHERE id = ?", [sanitized, row.id]);
  }
}

async function saveAttachments(requestId, stage, attachments = []) {
  if (!Array.isArray(attachments)) throw new Error("Attachments must be a list");
  if (attachments.length > MAX_ATTACHMENTS_PER_STAGE) throw new Error(`Upload up to ${MAX_ATTACHMENTS_PER_STAGE} attachments`);
  const decodedAttachments = attachments.map((attachment) => ({ attachment, decoded: decodeAttachment(attachment) }));
  const saved = [];
  try {
    for (const { attachment, decoded } of decodedAttachments) {
      const id = createId();
      const fileName = `${id}${decoded.extension}`;
      await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), decoded.buffer, { flag: "wx" });
      saved.push({ id, fileName });
      await pool.query(
        "INSERT INTO request_attachments (id, request_id, stage, file_name, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, requestId, stage, fileName, sanitizedAttachmentName(attachment.name, decoded.extension, id), decoded.mimeType, decoded.buffer.length, nowMysql()]
      );
    }
  } catch (error) {
    for (const attachment of saved) {
      await pool.query("DELETE FROM request_attachments WHERE id = ?", [attachment.id]);
      await fs.promises.unlink(path.join(UPLOAD_DIR, attachment.fileName)).catch(() => {});
    }
    throw error;
  }
}

async function cleanupOrphanUploads() {
  const [rows] = await pool.query("SELECT file_name FROM request_attachments");
  const referenced = new Set(rows.map((row) => row.file_name));
  for (const fileName of await fs.promises.readdir(UPLOAD_DIR)) {
    if (!referenced.has(fileName)) await fs.promises.unlink(path.join(UPLOAD_DIR, fileName));
  }
}

async function clearUploads() {
  for (const fileName of await fs.promises.readdir(UPLOAD_DIR)) {
    await fs.promises.unlink(path.join(UPLOAD_DIR, fileName));
  }
}

function mapRequest(row, offers = [], passedProviderIds = [], attachments = []) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    category: row.category,
    urgency: row.urgency,
    area: row.area,
    budget: row.budget,
    details: row.details,
    status: row.status,
    offers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    providerDoneAt: row.provider_done_at,
    autoConfirmAt: row.auto_confirm_at,
    paymentReleasedAt: row.payment_released_at,
    ratingDeadlineAt: row.rating_deadline_at,
    proofNote: row.proof_note || "",
    revisionNote: row.revision_note || "",
    ratingScore: row.rating_score,
    ratingNote: row.rating_note || "",
    clientRatingScore: row.client_rating_score,
    clientRatingNote: row.client_rating_note || "",
    clientRatedAt: row.client_rated_at,
    providerRatingScore: row.provider_rating_score,
    providerRatingNote: row.provider_rating_note || "",
    providerRatedAt: row.provider_rated_at,
    disputeNote: row.dispute_note || "",
    acceptedProviderId: row.accepted_provider_id || "",
    passedProviderIds,
    requestAttachments: attachments.filter((attachment) => attachment.stage === "request"),
    completionAttachments: attachments.filter((attachment) => attachment.stage === "completion"),
    ratingsVisible: Boolean(row.client_rated_at && row.provider_rated_at) || (row.rating_deadline_at && new Date(row.rating_deadline_at).getTime() <= Date.now()),
  };
}

function mapActivity(row) {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function mapMessage(row, reactions = []) {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    detail: decryptMessage(row.detail, row.id),
    createdAt: row.created_at,
    reactions,
  };
}

function canReadConversation(request, user) {
  return Boolean(request.accepted_provider_id) && (user.role === "admin" || request.client_id === user.id || request.accepted_provider_id === user.id);
}

function canWriteConversation(request, user) {
  if (user.role === "admin" || !canReadConversation(request, user)) return false;
  if (request.status === "Disputed") return !request.payment_released_at;
  return ["Accepted", "In Progress", "Provider Marked Done", "Revision Requested"].includes(request.status);
}

function activeConversationUserIds(requestId) {
  const cutoff = Date.now() - 45000;
  const room = conversationPresence.get(requestId);
  if (!room) return [];
  for (const [userId, seenAt] of room) {
    if (seenAt < cutoff) room.delete(userId);
  }
  if (!room.size) conversationPresence.delete(requestId);
  return Array.from(room.keys());
}

async function getState(viewer = null) {
  await autoConfirmExpiredJobs();
  await closeExpiredRatingWindows();
  const [userRows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  const [providerRows] = await pool.query("SELECT * FROM providers ORDER BY updated_at DESC");
  const [requestRows] = await pool.query("SELECT * FROM requests ORDER BY created_at DESC");
  const [offerRows] = await pool.query("SELECT * FROM offers ORDER BY created_at ASC");
  const [attachmentRows] = await pool.query("SELECT * FROM request_attachments ORDER BY created_at ASC");
  const [passRows] = await pool.query("SELECT * FROM request_passes ORDER BY created_at ASC");
  const [activityRows] = await pool.query("SELECT * FROM activities ORDER BY created_at DESC LIMIT 80");

  const offersByRequest = new Map();
  const acceptedProviderByRequest = new Map(requestRows.map((row) => [row.id, row.accepted_provider_id]));
  for (const row of offerRows) {
    if (viewer?.role === "provider" && row.provider_id !== viewer.id) continue;
    const acceptedProviderId = acceptedProviderByRequest.get(row.request_id);
    if (acceptedProviderId && row.provider_id !== acceptedProviderId) continue;
    const offer = mapOffer(row);
    if (!offersByRequest.has(row.request_id)) offersByRequest.set(row.request_id, []);
    offersByRequest.get(row.request_id).push(offer);
  }
  const passesByRequest = new Map();
  for (const row of passRows) {
    if (!passesByRequest.has(row.request_id)) passesByRequest.set(row.request_id, []);
    passesByRequest.get(row.request_id).push(row.provider_id);
  }
  const attachmentsByRequest = new Map();
  for (const row of attachmentRows) {
    if (!attachmentsByRequest.has(row.request_id)) attachmentsByRequest.set(row.request_id, []);
    attachmentsByRequest.get(row.request_id).push(mapAttachment(row));
  }

  return {
    users: userRows.map(mapUser).map(publicUser),
    providers: providerRows.map(mapProvider),
    requests: requestRows.map((row) => mapRequest(row, offersByRequest.get(row.id) || [], passesByRequest.get(row.id) || [], attachmentsByRequest.get(row.id) || [])),
    activities: activityRows.map(mapActivity),
  };
}

function getStateFor(user) {
  return getState(user || null);
}

async function closeExpiredRatingWindows() {
  const [rows] = await pool.query(
    "SELECT id, category, client_name FROM requests WHERE status = 'Payment Released' AND rating_deadline_at IS NOT NULL AND rating_deadline_at <= NOW()"
  );
  if (!rows.length) return;

  await pool.query(
    "UPDATE requests SET status = 'Rated / Closed', updated_at = NOW() WHERE status = 'Payment Released' AND rating_deadline_at IS NOT NULL AND rating_deadline_at <= NOW()"
  );

  for (const row of rows) {
    await addActivity("Rating window closed", `${row.category} for ${row.client_name} was closed after ${RATING_WINDOW_DAYS} days`);
    broadcast("kaila.request.action", { requestId: row.id, action: "rating_window_closed", status: "Rated / Closed" });
  }
}

async function autoConfirmExpiredJobs() {
  const [rows] = await pool.query(
    "SELECT id, category, client_name FROM requests WHERE status = 'Provider Marked Done' AND auto_confirm_at IS NOT NULL AND auto_confirm_at <= NOW()"
  );
  if (!rows.length) return;

  await pool.query(
    "UPDATE requests SET status = 'Payment Released', updated_at = NOW(), confirmed_at = NOW(), payment_released_at = NOW(), rating_deadline_at = ? WHERE status = 'Provider Marked Done' AND auto_confirm_at IS NOT NULL AND auto_confirm_at <= NOW()",
    [futureMysqlDays(RATING_WINDOW_DAYS)]
  );

  for (const row of rows) {
    await addActivity("Auto-confirmed", `${row.category} for ${row.client_name} was auto-confirmed after ${AUTO_CONFIRM_HOURS} hours`);
    broadcast("kaila.request.action", { requestId: row.id, action: "auto_confirm", status: "Payment Released" });
  }
}

async function getUser(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return mapUser(rows[0]);
}

async function addActivity(title, detail) {
  const activity = { id: createId(), title, detail, createdAt: nowMysql() };
  await pool.query("INSERT INTO activities (id, title, detail, created_at) VALUES (?, ?, ?, ?)", [
    activity.id,
    activity.title,
    activity.detail,
    activity.createdAt,
  ]);
  broadcast("kaila.activity", activity);
  return activity;
}

function broadcast(event, data) {
  io.to(CHANNEL).emit(event, data);
}

async function requireUser(req, res, next) {
  const userId = req.headers["x-kaila-user-id"];
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
}

app.get("/", (req, res) => {
  res.json({ app: "KAILA MVP API", url: APP_URL, channel: CHANNEL, database: DB_CONFIG.database, status: "online" });
});

app.get("/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ app: "KAILA MVP API", url: APP_URL, channel: CHANNEL, database: DB_CONFIG.database, status: "online" });
});

app.get("/media/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT file_name, mime_type FROM request_attachments WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).end();
  res.type(rows[0].mime_type);
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(path.join(UPLOAD_DIR, rows[0].file_name));
});

app.get("/api/state", async (req, res) => {
  const userId = req.get("X-KAILA-User-Id");
  const [rows] = userId ? await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]) : [[]];
  res.json(await getState(rows.length ? mapUser(rows[0]) : null));
});

app.post("/api/register", async (req, res) => {
  const { name, username, password, role, area, category } = req.body || {};
  const cleanUsername = String(username || "").trim().toLowerCase();
  if (!name || !cleanUsername || !password || !role || !area) return res.status(400).json({ error: "Missing required fields" });
  if (!/^[a-z0-9._-]{3,40}$/.test(cleanUsername)) return res.status(400).json({ error: "Username must be 3 to 40 characters using letters, numbers, dots, underscores, or hyphens" });
  if (!["client", "provider"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const [existing] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [cleanUsername]);
  if (existing.length) return res.status(409).json({ error: "Username already registered" });

  const user = {
    id: createId(),
    name: String(name).trim(),
    username: cleanUsername,
    email: null,
    password_hash: passwordHash(password),
    role,
    area: String(area).trim(),
    category: category || "",
    createdAt: nowMysql(),
  };

  await pool.query(
    "INSERT INTO users (id, name, username, email, password_hash, role, area, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user.id, user.name, user.username, user.email, user.password_hash, user.role, user.area, user.category, user.createdAt]
  );

  if (role === "provider" && category) {
    await pool.query(
      "INSERT INTO providers (id, user_id, name, category, area, availability, skills, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [createId(), user.id, user.name, category, user.area, "Available", "", user.createdAt, user.createdAt]
    );
  }

  await addActivity("User registered", `${user.name} joined as ${user.role}`);
  const state = await getState();
  broadcast("kaila.state.updated", state);
  res.status(201).json({ user: publicUser(user), state });
});

app.post("/api/login", async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
  const user = mapUser(rows[0]);
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: "Invalid username or password" });
  res.json({ user: publicUser(user), state: await getStateFor(user) });
});

app.post("/api/providers", requireUser, async (req, res) => {
  if (!["provider", "admin"].includes(req.user.role)) return res.status(403).json({ error: "Only providers or admins can save provider profiles" });
  const { category, area, availability, skills } = req.body || {};
  if (!category || !area) return res.status(400).json({ error: "Category and area are required" });
  const timestamp = nowMysql();
  const providerId = createId();

  await pool.query(
    `INSERT INTO providers (id, user_id, name, category, area, availability, skills, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE category = VALUES(category), area = VALUES(area), availability = VALUES(availability), skills = VALUES(skills), updated_at = VALUES(updated_at)`,
    [providerId, req.user.id, req.user.name, category, area, availability || "Available", skills || "", timestamp, timestamp]
  );
  const [rows] = await pool.query("SELECT * FROM providers WHERE user_id = ? LIMIT 1", [req.user.id]);
  const provider = mapProvider(rows[0]);
  await addActivity("Provider saved", `${provider.name} - ${provider.category}`);
  broadcast("kaila.provider.saved", { provider });
  res.json({ provider, state: await getStateFor(req.user) });
});

app.post("/api/requests", requireUser, async (req, res) => {
  if (!["client", "admin"].includes(req.user.role)) return res.status(403).json({ error: "Only clients or admins can post requests" });
  const { category, urgency, area, budget, details, attachments = [] } = req.body || {};
  if (!category || !area || !details) return res.status(400).json({ error: "Category, area, and details are required" });
  const timestamp = nowMysql();
  const request = {
    id: createId(),
    clientId: req.user.id,
    clientName: req.user.name,
    category,
    urgency: urgency || "Today",
    area,
    budget: budget || "Open",
    details,
    status: "Posted",
    offers: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await pool.query(
    "INSERT INTO requests (id, client_id, client_name, category, urgency, area, budget, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [request.id, request.clientId, request.clientName, request.category, request.urgency, request.area, request.budget, request.details, request.status, request.createdAt, request.updatedAt]
  );
  try {
    await saveAttachments(request.id, "request", attachments);
  } catch (error) {
    await pool.query("DELETE FROM requests WHERE id = ?", [request.id]);
    return res.status(400).json({ error: error.message });
  }
  await addActivity("Request posted", `${request.category} in ${request.area}`);
  broadcast("kaila.request.created", { request });
  res.status(201).json({ request, state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/offers", requireUser, async (req, res) => {
  if (!["provider", "admin"].includes(req.user.role)) return res.status(403).json({ error: "Only providers or admins can send offers" });
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!["Posted", "Offers Received", "Countered"].includes(requestRows[0].status)) return res.status(400).json({ error: "This request is no longer accepting offers" });
  if (req.user.role === "provider") {
    const [providerRows] = await pool.query("SELECT category FROM providers WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (!providerRows.length || providerRows[0].category !== requestRows[0].category) return res.status(403).json({ error: "This request does not match your provider category" });
    const [passRows] = await pool.query("SELECT request_id FROM request_passes WHERE request_id = ? AND provider_id = ? LIMIT 1", [req.params.id, req.user.id]);
    if (passRows.length) return res.status(400).json({ error: "You already passed this request" });
  }
  const { amount, schedule, notes, type } = req.body || {};
  if (!amount) return res.status(400).json({ error: "Amount is required" });
  const offer = {
    id: createId(),
    type: type === "counter" ? "counter" : "offer",
    providerId: req.user.id,
    providerName: req.user.name,
    amount,
    schedule: schedule || "",
    notes: notes || "",
    createdAt: nowMysql(),
  };
  const status = offer.type === "counter" ? "Countered" : "Offers Received";
  await pool.query("DELETE FROM offers WHERE request_id = ? AND provider_id = ?", [req.params.id, offer.providerId]);
  await pool.query(
    "INSERT INTO offers (id, request_id, type, provider_id, provider_name, amount, schedule, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [offer.id, req.params.id, offer.type, offer.providerId, offer.providerName, offer.amount, offer.schedule, offer.notes, offer.createdAt]
  );
  await pool.query("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?", [status, nowMysql(), req.params.id]);
  await addActivity(offer.type === "counter" ? "Counter-offer sent" : "Offer sent", `${offer.amount} for ${requestRows[0].category}`);
  broadcast("kaila.offer.saved", { requestId: req.params.id, offer, status });
  res.status(201).json({ offer, state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/pass", requireUser, async (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can pass requests" });
  const [requestRows] = await pool.query("SELECT status FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!["Posted", "Offers Received", "Countered"].includes(requestRows[0].status)) return res.status(400).json({ error: "This request can no longer be passed" });
  await pool.query(
    "INSERT IGNORE INTO request_passes (request_id, provider_id, created_at) VALUES (?, ?, ?)",
    [req.params.id, req.user.id, nowMysql()]
  );
  broadcast("kaila.request.passed", { requestId: req.params.id, providerId: req.user.id });
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/confirm", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (req.user.role !== "admin" && request.client_id !== req.user.id) return res.status(403).json({ error: "Only the client or admin can confirm this job" });
  const offerId = String(req.body?.offerId || "");
  if (!offerId) return res.status(400).json({ error: "Select an offer first" });
  const [offerRows] = await pool.query("SELECT provider_id FROM offers WHERE id = ? AND request_id = ? LIMIT 1", [offerId, req.params.id]);
  if (!offerRows.length) return res.status(400).json({ error: "Cannot confirm without an offer" });
  const timestamp = nowMysql();
  await pool.query("UPDATE requests SET status = 'Accepted', accepted_provider_id = ?, confirmed_at = ?, updated_at = ? WHERE id = ?", [offerRows[0].provider_id, timestamp, timestamp, req.params.id]);
  await addActivity("Offer accepted", `${request.category} for ${request.client_name}`);
  broadcast("kaila.request.confirmed", { requestId: req.params.id });
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/action", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });

  const request = requestRows[0];
  const action = String(req.body?.action || "");
  const note = String(req.body?.note || "").trim();
  const score = Number(req.body?.score || 0);
  const timestamp = nowMysql();
  const isClient = request.client_id === req.user.id;
  const isProviderForJob = req.user.role === "admin" || request.accepted_provider_id === req.user.id;

  let nextStatus = "";
  let activityTitle = "";
  let activityDetail = "";
  let extraSql = "";
  let extraParams = [];

  if (action === "start") {
    if (!isProviderForJob || request.status !== "Accepted") return res.status(403).json({ error: "Only the approved provider can start an accepted job" });
    nextStatus = "In Progress";
    activityTitle = "Job started";
    activityDetail = `${request.category} is now in progress`;
  } else if (action === "provider_complete") {
    if (!isProviderForJob || !["Accepted", "In Progress", "Revision Requested"].includes(request.status)) return res.status(403).json({ error: "Only the approved provider can mark this job done" });
    nextStatus = "Provider Marked Done";
    extraSql = ", provider_done_at = ?, auto_confirm_at = ?, proof_note = ?";
    extraParams = [timestamp, futureMysqlHours(AUTO_CONFIRM_HOURS), note];
    activityTitle = "Provider marked done";
    activityDetail = `${request.category} is waiting for client confirmation`;
  } else if (action === "client_complete") {
    if (req.user.role !== "admin" && !isClient) return res.status(403).json({ error: "Only the client can confirm completion" });
    if (request.status !== "Provider Marked Done") return res.status(400).json({ error: "Provider must mark the job done first" });
    nextStatus = "Payment Released";
    extraSql = ", confirmed_at = ?, payment_released_at = ?, rating_deadline_at = ?";
    extraParams = [timestamp, timestamp, futureMysqlDays(RATING_WINDOW_DAYS)];
    activityTitle = "Completion confirmed";
    activityDetail = `${request.category} is completed and payment is released`;
  } else if (action === "rate") {
    if (request.status !== "Payment Released") return res.status(400).json({ error: "Only payment-released jobs can be rated" });
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ error: "Rating must be 1 to 5" });
    if (isClient || req.user.role === "admin") {
      if (request.client_rated_at) return res.status(400).json({ error: "Client already rated this job" });
      extraSql = ", client_rating_score = ?, client_rating_note = ?, client_rated_at = ?";
      extraParams = [score, note, timestamp];
      activityTitle = "Client rating submitted";
      activityDetail = `${request.category} received a client rating`;
    } else if (isProviderForJob) {
      if (request.provider_rated_at) return res.status(400).json({ error: "Provider already rated this job" });
      extraSql = ", provider_rating_score = ?, provider_rating_note = ?, provider_rated_at = ?";
      extraParams = [score, note, timestamp];
      activityTitle = "Provider rating submitted";
      activityDetail = `${request.category} received a provider rating`;
    } else {
      return res.status(403).json({ error: "Only involved client or provider can rate this job" });
    }
    const clientRated = Boolean(request.client_rated_at) || isClient || req.user.role === "admin";
    const providerRated = Boolean(request.provider_rated_at) || (!isClient && isProviderForJob);
    nextStatus = clientRated && providerRated ? "Rated / Closed" : "Payment Released";
  } else if (action === "cancel") {
    if (req.user.role !== "admin" && !isClient) return res.status(403).json({ error: "Only the client or admin can cancel this request" });
    if (["Provider Marked Done", "Payment Released", "Rated", "Cancelled"].includes(request.status)) return res.status(400).json({ error: "This job can no longer be cancelled" });
    nextStatus = "Cancelled";
    activityTitle = "Job cancelled";
    activityDetail = `${request.category}${note ? ` - ${note}` : ""}`;
  } else if (action === "dispute") {
    if (req.user.role !== "admin" && !isClient && !isProviderForJob) return res.status(403).json({ error: "Only involved users can dispute this job" });
    if (!["Accepted", "In Progress", "Provider Marked Done", "Payment Released"].includes(request.status)) return res.status(400).json({ error: "This job cannot be disputed at this stage" });
    if (!note) return res.status(400).json({ error: "Dispute note is required" });
    nextStatus = "Disputed";
    extraSql = ", dispute_note = ?";
    extraParams = [note];
    activityTitle = "Job disputed";
    activityDetail = `${request.category} - ${note}`;
  } else if (action === "resolve_dispute") {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Only admin can resolve disputes" });
    if (request.status !== "Disputed") return res.status(400).json({ error: "Only disputed jobs can be resolved" });
    nextStatus = "Resolved";
    activityTitle = "Dispute resolved";
    activityDetail = `${request.category}${note ? ` - ${note}` : ""}`;
  } else if (action === "request_revision") {
    if (req.user.role !== "admin" && !isClient) return res.status(403).json({ error: "Only the client can request revision" });
    if (request.status !== "Provider Marked Done") return res.status(400).json({ error: "Revision can only be requested after provider marks done" });
    if (!note) return res.status(400).json({ error: "Revision note is required" });
    nextStatus = "Revision Requested";
    extraSql = ", revision_note = ?";
    extraParams = [note];
    activityTitle = "Revision requested";
    activityDetail = `${request.category} - ${note}`;
  } else {
    return res.status(400).json({ error: "Invalid job action" });
  }

  if (action === "provider_complete") {
    try {
      await saveAttachments(req.params.id, "completion", req.body?.attachments || []);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  await pool.query(
    `UPDATE requests SET status = ?, updated_at = ?${extraSql} WHERE id = ?`,
    [nextStatus, timestamp, ...extraParams, req.params.id]
  );
  await addActivity(activityTitle, activityDetail);
  broadcast("kaila.request.action", { requestId: req.params.id, action, status: nextStatus });
  res.json({ state: await getStateFor(req.user) });
});

app.get("/api/requests/:id/messages", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (!canReadConversation(request, req.user)) return res.status(403).json({ error: "Conversation is only available to the confirmed job parties" });
  const [messageRows] = await pool.query("SELECT * FROM job_messages WHERE request_id = ? ORDER BY created_at ASC", [req.params.id]);
  const [reactionRows] = await pool.query(
    "SELECT reaction.message_id, reaction.user_id, reaction.reaction FROM job_message_reactions AS reaction JOIN job_messages AS message ON message.id = reaction.message_id WHERE message.request_id = ?",
    [req.params.id]
  );
  const reactionsByMessage = new Map();
  for (const row of reactionRows) {
    if (!reactionsByMessage.has(row.message_id)) reactionsByMessage.set(row.message_id, []);
    reactionsByMessage.get(row.message_id).push({ userId: row.user_id, reaction: row.reaction });
  }
  res.json({
    messages: messageRows.map((row) => mapMessage(row, reactionsByMessage.get(row.id) || [])),
    writable: canWriteConversation(request, req.user),
    activeUserIds: activeConversationUserIds(req.params.id),
  });
});

app.post("/api/requests/:id/messages", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (!canWriteConversation(request, req.user)) return res.status(403).json({ error: "This conversation is archived and can no longer receive messages" });
  const detail = String(req.body?.detail || "").trim();
  if (!detail) return res.status(400).json({ error: "Message is required" });
  if (detail.length > 2000) return res.status(400).json({ error: "Message must be 2000 characters or fewer" });
  const message = {
    id: createId(),
    requestId: req.params.id,
    senderId: req.user.id,
    senderName: req.user.name,
    detail,
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO job_messages (id, request_id, sender_id, sender_name, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [message.id, message.requestId, message.senderId, message.senderName, encryptMessage(message.detail, message.id), message.createdAt]
  );
  broadcast("kaila.message.saved", { requestId: req.params.id, message });
  res.status(201).json({ message });
});

app.post("/api/requests/:id/typing", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!canWriteConversation(requestRows[0], req.user)) return res.status(403).json({ error: "This conversation is archived" });
  broadcast("kaila.typing.changed", {
    requestId: req.params.id,
    senderId: req.user.id,
    senderName: req.user.name,
    typing: Boolean(req.body?.typing),
  });
  res.json({ ok: true });
});

app.post("/api/requests/:id/presence", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!canReadConversation(requestRows[0], req.user)) return res.status(403).json({ error: "Conversation is only available to the confirmed job parties" });
  const room = conversationPresence.get(req.params.id) || new Map();
  if (req.body?.active) room.set(req.user.id, Date.now());
  else room.delete(req.user.id);
  if (room.size) conversationPresence.set(req.params.id, room);
  else conversationPresence.delete(req.params.id);
  broadcast("kaila.presence.changed", { requestId: req.params.id });
  res.json({ activeUserIds: activeConversationUserIds(req.params.id) });
});

app.post("/api/requests/:requestId/messages/:messageId/reactions", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.requestId]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!canWriteConversation(requestRows[0], req.user)) return res.status(403).json({ error: "This conversation is archived and can no longer receive reactions" });
  const [messageRows] = await pool.query("SELECT id FROM job_messages WHERE id = ? AND request_id = ? LIMIT 1", [req.params.messageId, req.params.requestId]);
  if (!messageRows.length) return res.status(404).json({ error: "Message not found" });
  const reaction = "like";
  const [rows] = await pool.query("SELECT message_id FROM job_message_reactions WHERE message_id = ? AND user_id = ? AND reaction = ? LIMIT 1", [req.params.messageId, req.user.id, reaction]);
  if (rows.length) {
    await pool.query("DELETE FROM job_message_reactions WHERE message_id = ? AND user_id = ? AND reaction = ?", [req.params.messageId, req.user.id, reaction]);
  } else {
    await pool.query("INSERT INTO job_message_reactions (message_id, user_id, reaction, created_at) VALUES (?, ?, ?, ?)", [req.params.messageId, req.user.id, reaction, nowMysql()]);
  }
  broadcast("kaila.message.reaction", { requestId: req.params.requestId, messageId: req.params.messageId });
  res.json({ reacted: !rows.length });
});

app.post("/api/activity", requireUser, async (req, res) => {
  const detail = String(req.body?.detail || "").trim();
  if (!detail) return res.status(400).json({ error: "Message is required" });
  const activity = await addActivity("Team note", `${req.user.name}: ${detail}`);
  res.status(201).json({ activity, state: await getStateFor(req.user) });
});

app.post("/api/admin/truncate", requireUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  await pool.query("TRUNCATE TABLE activities");
  await pool.query("TRUNCATE TABLE job_message_reactions");
  await pool.query("TRUNCATE TABLE job_messages");
  await pool.query("TRUNCATE TABLE request_attachments");
  await pool.query("TRUNCATE TABLE request_passes");
  await pool.query("TRUNCATE TABLE offers");
  await pool.query("TRUNCATE TABLE requests");
  await pool.query("TRUNCATE TABLE providers");
  await pool.query("TRUNCATE TABLE users");
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  await clearUploads();
  const state = await getState();
  broadcast("kaila.state.updated", state);
  res.json({ state });
});

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    if (!channel) return;
    socket.join(channel);
    socket.emit("kaila.socket.ready", { channel, socketId: socket.id });
  });
});

initializeDatabase()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`KAILA MVP API listening at ${APP_URL} using MySQL database ${DB_CONFIG.database}`);
    });
    setInterval(() => {
      autoConfirmExpiredJobs().catch((error) => console.error("Auto-confirm failed:", error));
      closeExpiredRatingWindows().catch((error) => console.error("Rating close failed:", error));
    }, 60 * 1000);
  })
  .catch((error) => {
    console.error("Failed to initialize MySQL database:", error);
    process.exit(1);
  });
