const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), quiet: true });

const APP_TIME_ZONE = "Asia/Manila";
process.env.TZ = APP_TIME_ZONE;

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
const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");
const PROFILE_UPLOAD_DIR = path.resolve(__dirname, "..", "profile-photos");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_STAGE = 3;
const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const ALLOWED_MEDIA_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);
const ALLOWED_PROFILE_PHOTO_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kaila_mvp",
  timezone: "+08:00",
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;
const conversationPresence = new Map();
const activeCalls = new Map();

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

function parseIceServers() {
  const rawJson = String(process.env.KAILA_RTC_ICE_SERVERS || "").trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.every((item) => item && item.urls)) return parsed;
    } catch (error) {
      console.warn("Ignoring invalid KAILA_RTC_ICE_SERVERS JSON:", error.message);
    }
  }

  const turnUrls = String(process.env.KAILA_TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  if (!turnUrls.length) return DEFAULT_ICE_SERVERS;

  return [
    ...DEFAULT_ICE_SERVERS,
    {
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: String(process.env.KAILA_TURN_USERNAME || ""),
      credential: String(process.env.KAILA_TURN_CREDENTIAL || ""),
    },
  ];
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

function normalizeCategories(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  return Array.from(new Set(raw.map((item) => String(item).trim()).filter(Boolean))).join(", ");
}

function hasCategory(categories, category) {
  return normalizeCategories(categories).split(",").map((item) => item.trim()).includes(String(category || "").trim());
}

function normalizeAccountRole(role) {
  const cleanRole = String(role || "").trim().toLowerCase();
  return cleanRole === "ops" ? "ops" : cleanRole;
}

function boolField(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase()) || value === true;
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
  return mysqlDateTime(new Date());
}

function futureMysqlHours(hours) {
  return mysqlDateTime(new Date(Date.now() + hours * 60 * 60 * 1000));
}

function futureMysqlDays(days) {
  return mysqlDateTime(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}

function mysqlDateTime(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, password, email, ...safe } = user;
  return safe;
}

function decodeProfilePhoto(photo) {
  if (!photo) return null;
  const match = String(photo?.dataUrl || "").match(/^data:([^;,]+);base64,([a-z0-9+/=\r\n]+)$/i);
  if (!match || !ALLOWED_PROFILE_PHOTO_TYPES.has(match[1])) throw new Error("Profile photo must be JPG, PNG, or WebP");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_PROFILE_PHOTO_BYTES) throw new Error("Profile photo must be 2 MB or smaller");
  if (!matchesMediaSignature(match[1], buffer)) throw new Error("Profile photo content does not match its media type");
  return { buffer, mimeType: match[1], extension: ALLOWED_PROFILE_PHOTO_TYPES.get(match[1]) };
}

async function initializeDatabase() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.promises.mkdir(PROFILE_UPLOAD_DIR, { recursive: true });
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
      role ENUM('client','provider','admin','ops') NOT NULL,
      area VARCHAR(190) NOT NULL,
      category VARCHAR(160) NULL,
      contact_number VARCHAR(80) NULL,
      messenger_link VARCHAR(255) NULL,
      preferred_contact_channel VARCHAR(80) NULL,
      best_contact_time VARCHAR(120) NULL,
      data_privacy_consent TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("users", "username", "VARCHAR(80) NULL");
  await ensureColumn("users", "photo_file", "VARCHAR(255) NULL");
  await ensureColumn("users", "photo_mime_type", "VARCHAR(120) NULL");
  await ensureColumn("users", "contact_number", "VARCHAR(80) NULL");
  await ensureColumn("users", "messenger_link", "VARCHAR(255) NULL");
  await ensureColumn("users", "preferred_contact_channel", "VARCHAR(80) NULL");
  await ensureColumn("users", "best_contact_time", "VARCHAR(120) NULL");
  await ensureColumn("users", "data_privacy_consent", "TINYINT(1) NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('client','provider','admin','ops') NOT NULL");
  await pool.query("ALTER TABLE users MODIFY COLUMN category VARCHAR(255) NULL");
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
      display_name VARCHAR(160) NULL,
      provider_type VARCHAR(80) NULL,
      specific_services TEXT NULL,
      years_experience VARCHAR(80) NULL,
      coverage_area TEXT NULL,
      emergency_availability VARCHAR(80) NULL,
      available_days VARCHAR(160) NULL,
      available_time VARCHAR(160) NULL,
      travel_limits TEXT NULL,
      minimum_fee VARCHAR(80) NULL,
      price_range TEXT NULL,
      work_samples TEXT NULL,
      certificate_proof TEXT NULL,
      valid_id_consent TINYINT(1) NOT NULL DEFAULT 0,
      consent_requests TINYINT(1) NOT NULL DEFAULT 0,
      consent_ratings TINYINT(1) NOT NULL DEFAULT 0,
      rules_agreement TINYINT(1) NOT NULL DEFAULT 0,
      trust_level VARCHAR(80) NOT NULL DEFAULT 'Listed',
      status VARCHAR(80) NOT NULL DEFAULT 'Active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY providers_user_unique (user_id),
      CONSTRAINT providers_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query("ALTER TABLE providers MODIFY COLUMN category VARCHAR(255) NOT NULL");
  await ensureColumn("providers", "display_name", "VARCHAR(160) NULL");
  await ensureColumn("providers", "provider_type", "VARCHAR(80) NULL");
  await ensureColumn("providers", "specific_services", "TEXT NULL");
  await ensureColumn("providers", "years_experience", "VARCHAR(80) NULL");
  await ensureColumn("providers", "coverage_area", "TEXT NULL");
  await ensureColumn("providers", "emergency_availability", "VARCHAR(80) NULL");
  await ensureColumn("providers", "available_days", "VARCHAR(160) NULL");
  await ensureColumn("providers", "available_time", "VARCHAR(160) NULL");
  await ensureColumn("providers", "travel_limits", "TEXT NULL");
  await ensureColumn("providers", "minimum_fee", "VARCHAR(80) NULL");
  await ensureColumn("providers", "price_range", "TEXT NULL");
  await ensureColumn("providers", "work_samples", "TEXT NULL");
  await ensureColumn("providers", "certificate_proof", "TEXT NULL");
  await ensureColumn("providers", "valid_id_consent", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("providers", "consent_requests", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("providers", "consent_ratings", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("providers", "rules_agreement", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("providers", "trust_level", "VARCHAR(80) NOT NULL DEFAULT 'Listed'");
  await ensureColumn("providers", "status", "VARCHAR(80) NOT NULL DEFAULT 'Active'");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(64) PRIMARY KEY,
      client_id VARCHAR(64) NOT NULL,
      client_name VARCHAR(160) NOT NULL,
      category VARCHAR(160) NOT NULL,
      urgency VARCHAR(80) NOT NULL,
      area VARCHAR(190) NOT NULL,
      budget VARCHAR(80) NOT NULL,
      preferred_schedule VARCHAR(160) NULL,
      contact_method VARCHAR(160) NULL,
      exact_location_notes TEXT NULL,
      permission_to_forward TINYINT(1) NOT NULL DEFAULT 0,
      consent_to_rate TINYINT(1) NOT NULL DEFAULT 0,
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
  await ensureColumn("requests", "preferred_schedule", "VARCHAR(160) NULL");
  await ensureColumn("requests", "contact_method", "VARCHAR(160) NULL");
  await ensureColumn("requests", "exact_location_notes", "TEXT NULL");
  await ensureColumn("requests", "permission_to_forward", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("requests", "consent_to_rate", "TINYINT(1) NOT NULL DEFAULT 0");
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
      stage ENUM('request','completion','dispute') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL,
      size_bytes INT NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT request_attachments_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query("ALTER TABLE request_attachments MODIFY COLUMN stage ENUM('request','completion','dispute') NOT NULL");
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
    CREATE TABLE IF NOT EXISTS validation_entries (
      id VARCHAR(64) PRIMARY KEY,
      type ENUM('client_survey','provider_interview') NOT NULL,
      operator_id VARCHAR(64) NOT NULL,
      operator_name VARCHAR(160) NOT NULL,
      subject_name VARCHAR(160) NULL,
      area VARCHAR(190) NULL,
      category VARCHAR(160) NULL,
      decision_signal VARCHAR(80) NULL,
      responses JSON NOT NULL,
      notes TEXT NULL,
      created_at DATETIME NOT NULL,
      INDEX validation_entries_type_idx (type),
      INDEX validation_entries_created_idx (created_at)
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

function emptyReputation() {
  return { average: null, count: 0 };
}

function mapUser(row, reputation = emptyReputation()) {
  if (!row) return null;
  const photoVersion = row.photo_file ? encodeURIComponent(row.photo_file) : "";
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    area: row.area,
    category: row.category || "",
    contactNumber: row.contact_number || "",
    messengerLink: row.messenger_link || "",
    preferredContactChannel: row.preferred_contact_channel || "",
    bestContactTime: row.best_contact_time || "",
    dataPrivacyConsent: Boolean(row.data_privacy_consent),
    photoUrl: row.photo_file ? `/profile-media/${encodeURIComponent(row.id)}?v=${photoVersion}` : "",
    reputation,
    createdAt: row.created_at,
  };
}

function mapProvider(row, reputation = emptyReputation(), photoUrl = "") {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    area: row.area,
    availability: row.availability,
    skills: row.skills || "",
    displayName: row.display_name || row.name,
    providerType: row.provider_type || "",
    specificServices: row.specific_services || "",
    yearsExperience: row.years_experience || "",
    coverageArea: row.coverage_area || "",
    emergencyAvailability: row.emergency_availability || "",
    availableDays: row.available_days || "",
    availableTime: row.available_time || "",
    travelLimits: row.travel_limits || "",
    minimumFee: row.minimum_fee || "",
    priceRange: row.price_range || "",
    workSamples: row.work_samples || "",
    certificateProof: row.certificate_proof || "",
    validIdConsent: Boolean(row.valid_id_consent),
    consentRequests: Boolean(row.consent_requests),
    consentRatings: Boolean(row.consent_ratings),
    rulesAgreement: Boolean(row.rules_agreement),
    trustLevel: row.trust_level || "Listed",
    status: row.status || "Active",
    photoUrl,
    reputation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOffer(row, reputation = emptyReputation(), photoUrl = "") {
  return {
    id: row.id,
    type: row.type,
    providerId: row.provider_id,
    providerName: row.provider_name,
    amount: row.amount,
    schedule: row.schedule || "",
    notes: row.notes || "",
    providerPhotoUrl: photoUrl,
    providerReputation: reputation,
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

function mapRequest(row, offers = [], passedProviderIds = [], attachments = [], reputations = new Map(), profiles = new Map()) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhotoUrl: profiles.get(row.client_id)?.photoUrl || "",
    clientReputation: reputations.get(row.client_id) || emptyReputation(),
    clientContact: {
      name: profiles.get(row.client_id)?.name || row.client_name,
      contactNumber: profiles.get(row.client_id)?.contactNumber || "",
      messengerLink: profiles.get(row.client_id)?.messengerLink || "",
      preferredContactChannel: profiles.get(row.client_id)?.preferredContactChannel || "",
      bestContactTime: profiles.get(row.client_id)?.bestContactTime || "",
    },
    category: row.category,
    urgency: row.urgency,
    area: row.area,
    budget: row.budget,
    preferredSchedule: row.preferred_schedule || "",
    contactMethod: row.contact_method || "",
    exactLocationNotes: row.exact_location_notes || "",
    permissionToForward: Boolean(row.permission_to_forward),
    consentToRate: Boolean(row.consent_to_rate),
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
    acceptedProviderPhotoUrl: row.accepted_provider_id ? (profiles.get(row.accepted_provider_id)?.photoUrl || "") : "",
    acceptedProviderReputation: row.accepted_provider_id ? (reputations.get(row.accepted_provider_id) || emptyReputation()) : emptyReputation(),
    acceptedProviderContact: row.accepted_provider_id ? {
      name: profiles.get(row.accepted_provider_id)?.name || "",
      contactNumber: profiles.get(row.accepted_provider_id)?.contactNumber || "",
      messengerLink: profiles.get(row.accepted_provider_id)?.messengerLink || "",
      preferredContactChannel: profiles.get(row.accepted_provider_id)?.preferredContactChannel || "",
      bestContactTime: profiles.get(row.accepted_provider_id)?.bestContactTime || "",
    } : null,
    passedProviderIds,
    requestAttachments: attachments.filter((attachment) => attachment.stage === "request"),
    completionAttachments: attachments.filter((attachment) => attachment.stage === "completion"),
    disputeAttachments: attachments.filter((attachment) => attachment.stage === "dispute"),
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

function mapValidationEntry(row) {
  let responses = {};
  try {
    responses = typeof row.responses === "string" ? JSON.parse(row.responses) : row.responses || {};
  } catch {
    responses = {};
  }
  return {
    id: row.id,
    type: row.type,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    subjectName: row.subject_name || "",
    area: row.area || "",
    category: row.category || "",
    decisionSignal: row.decision_signal || "",
    responses,
    notes: row.notes || "",
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
  return Boolean(request.accepted_provider_id) && (request.client_id === user.id || request.accepted_provider_id === user.id);
}

function canWriteConversation(request, user) {
  if (user.role === "admin" || !canReadConversation(request, user)) return false;
  if (request.status === "Disputed") return !request.payment_released_at;
  return ["Accepted", "In Progress", "Provider Marked Done", "Revision Requested"].includes(request.status);
}

function otherConversationUserId(request, userId) {
  if (request.client_id === userId) return request.accepted_provider_id;
  if (request.accepted_provider_id === userId) return request.client_id;
  return "";
}

async function userSocketCount(userId) {
  return (await io.in(`user:${userId}`).fetchSockets()).length;
}

function relayCallSignal(targetUserId, signal) {
  io.to(`user:${targetUserId}`).emit("kaila.call.signal", signal);
}

async function endDisconnectedUserCalls(userId) {
  if (!userId || await userSocketCount(userId)) return;
  for (const [callId, call] of activeCalls) {
    if (!call.userIds.includes(userId)) continue;
    const targetUserId = call.userIds.find((id) => id !== userId);
    if (targetUserId) relayCallSignal(targetUserId, {
      requestId: call.requestId,
      callId,
      type: "offline",
      senderId: userId,
      senderName: "",
      description: null,
      candidate: null,
    });
    activeCalls.delete(callId);
  }
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

function ratingsAreVisible(row) {
  return Boolean(row.client_rated_at && row.provider_rated_at) || (row.rating_deadline_at && new Date(row.rating_deadline_at).getTime() <= Date.now());
}

function buildReputations(requestRows) {
  const scores = new Map();
  const add = (userId, score) => {
    const numeric = Number(score);
    if (!userId || !Number.isFinite(numeric) || numeric < 1 || numeric > 5) return;
    const current = scores.get(userId) || { total: 0, count: 0 };
    current.total += numeric;
    current.count += 1;
    scores.set(userId, current);
  };

  for (const row of requestRows) {
    if (!ratingsAreVisible(row)) continue;
    if (row.accepted_provider_id && row.client_rated_at) add(row.accepted_provider_id, row.client_rating_score);
    if (row.client_id && row.provider_rated_at) add(row.client_id, row.provider_rating_score);
  }

  const reputations = new Map();
  for (const [userId, value] of scores) {
    reputations.set(userId, { average: Math.round((value.total / value.count) * 10) / 10, count: value.count });
  }
  return reputations;
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
  const [validationRows] = ["admin", "ops"].includes(viewer?.role)
    ? await pool.query("SELECT * FROM validation_entries ORDER BY created_at DESC LIMIT 200")
    : [[]];
  const reputations = buildReputations(requestRows);
  const profiles = new Map(userRows.map((row) => [row.id, mapUser(row, reputations.get(row.id) || emptyReputation())]));
  if (viewer?.role === "ops") {
    return {
      users: Array.from(profiles.values()).filter((user) => user.id === viewer.id).map(publicUser),
      providers: [],
      requests: [],
      activities: [],
      validationEntries: validationRows.map(mapValidationEntry),
    };
  }

  const offersByRequest = new Map();
  const acceptedProviderByRequest = new Map(requestRows.map((row) => [row.id, row.accepted_provider_id]));
  const passedOfferKeys = new Set(passRows.map((row) => `${row.request_id}:${row.provider_id}`));
  for (const row of offerRows) {
    if (passedOfferKeys.has(`${row.request_id}:${row.provider_id}`)) continue;
    if (viewer?.role === "provider" && row.provider_id !== viewer.id) continue;
    const acceptedProviderId = acceptedProviderByRequest.get(row.request_id);
    if (acceptedProviderId && row.provider_id !== acceptedProviderId) continue;
    const offer = mapOffer(row, reputations.get(row.provider_id) || emptyReputation(), profiles.get(row.provider_id)?.photoUrl || "");
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
    users: Array.from(profiles.values()).map(publicUser),
    providers: providerRows.map((row) => mapProvider(row, reputations.get(row.user_id) || emptyReputation(), profiles.get(row.user_id)?.photoUrl || "")),
    requests: requestRows.map((row) => mapRequest(row, offersByRequest.get(row.id) || [], passesByRequest.get(row.id) || [], attachmentsByRequest.get(row.id) || [], reputations, profiles)),
    activities: activityRows.map(mapActivity),
    ...(["admin", "ops"].includes(viewer?.role) ? { validationEntries: validationRows.map(mapValidationEntry) } : {}),
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

async function createAccount(input = {}, allowedRoles = ["client", "provider"]) {
  const name = String(input.name || "").trim();
  const cleanUsername = String(input.username || "").trim().toLowerCase();
  const password = String(input.password || "");
  const role = normalizeAccountRole(input.role);
  const cleanCategory = normalizeCategories(input.category);
  const area = role === "ops" ? (String(input.area || "").trim() || "Operations") : String(input.area || "").trim();
  const contactNumber = String(input.contactNumber || "").trim();
  const preferredContactChannel = String(input.preferredContactChannel || "").trim();
  const dataPrivacyConsent = boolField(input.dataPrivacyConsent);
  const providerDetails = {
    displayName: String(input.displayName || name).trim(),
    providerType: String(input.providerType || "").trim(),
    specificServices: String(input.specificServices || "").trim(),
    yearsExperience: String(input.yearsExperience || "").trim(),
    coverageArea: String(input.coverageArea || "").trim(),
    emergencyAvailability: String(input.emergencyAvailability || "").trim(),
    availableDays: String(input.availableDays || "").trim(),
    availableTime: String(input.availableTime || "").trim(),
    travelLimits: String(input.travelLimits || "").trim(),
    minimumFee: String(input.minimumFee || "").trim(),
    priceRange: String(input.priceRange || "").trim(),
    workSamples: String(input.workSamples || "").trim(),
    certificateProof: String(input.certificateProof || "").trim(),
    validIdConsent: boolField(input.validIdConsent),
    consentRequests: boolField(input.consentRequests),
    consentRatings: boolField(input.consentRatings),
    rulesAgreement: boolField(input.rulesAgreement),
  };

  if (!name || !cleanUsername || !password || !role || !area || !contactNumber || !preferredContactChannel || !dataPrivacyConsent) {
    const error = new Error("Missing required fields");
    error.status = 400;
    throw error;
  }
  if (!/^[a-z0-9._-]{3,40}$/.test(cleanUsername)) {
    const error = new Error("Username must be 3 to 40 characters using letters, numbers, dots, underscores, or hyphens");
    error.status = 400;
    throw error;
  }
  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.status = 400;
    throw error;
  }
  if (!allowedRoles.includes(role)) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }
  if (role === "provider" && !cleanCategory) {
    const error = new Error("Provider service category is required");
    error.status = 400;
    throw error;
  }
  if (role === "provider" && (!providerDetails.specificServices || !providerDetails.coverageArea || !providerDetails.consentRequests || !providerDetails.consentRatings || !providerDetails.rulesAgreement)) {
    const error = new Error("Provider services, coverage area, request consent, rating consent, and rules agreement are required");
    error.status = 400;
    throw error;
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [cleanUsername]);
  if (existing.length) {
    const error = new Error("Username already registered");
    error.status = 409;
    throw error;
  }

  const user = {
    id: createId(),
    name,
    username: cleanUsername,
    email: null,
    password_hash: passwordHash(password),
    role,
    area,
    category: cleanCategory,
    contactNumber,
    messengerLink: String(input.messengerLink || "").trim(),
    preferredContactChannel,
    bestContactTime: String(input.bestContactTime || "").trim(),
    dataPrivacyConsent,
    createdAt: nowMysql(),
  };

  await pool.query(
    "INSERT INTO users (id, name, username, email, password_hash, role, area, category, contact_number, messenger_link, preferred_contact_channel, best_contact_time, data_privacy_consent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user.id, user.name, user.username, user.email, user.password_hash, user.role, user.area, user.category, user.contactNumber, user.messengerLink, user.preferredContactChannel, user.bestContactTime, user.dataPrivacyConsent ? 1 : 0, user.createdAt]
  );

  if (role === "provider") {
    await pool.query(
      `INSERT INTO providers (
        id, user_id, name, category, area, availability, skills, display_name, provider_type,
        specific_services, years_experience, coverage_area, emergency_availability, available_days,
        available_time, travel_limits, minimum_fee, price_range, work_samples, certificate_proof,
        valid_id_consent, consent_requests, consent_ratings, rules_agreement, trust_level, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createId(), user.id, providerDetails.displayName || user.name, cleanCategory, user.area, providerDetails.availableDays || "Available",
        providerDetails.specificServices, providerDetails.displayName || user.name, providerDetails.providerType,
        providerDetails.specificServices, providerDetails.yearsExperience, providerDetails.coverageArea, providerDetails.emergencyAvailability,
        providerDetails.availableDays, providerDetails.availableTime, providerDetails.travelLimits, providerDetails.minimumFee,
        providerDetails.priceRange, providerDetails.workSamples, providerDetails.certificateProof, providerDetails.validIdConsent ? 1 : 0,
        providerDetails.consentRequests ? 1 : 0, providerDetails.consentRatings ? 1 : 0, providerDetails.rulesAgreement ? 1 : 0,
        "Listed", "Active", user.createdAt, user.createdAt,
      ]
    );
  }

  return user;
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

app.get("/api/rtc-config", (req, res) => {
  res.json({ iceServers: parseIceServers() });
});

app.get("/media/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT file_name, mime_type FROM request_attachments WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).end();
  res.type(rows[0].mime_type);
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(path.join(UPLOAD_DIR, rows[0].file_name));
});

app.get("/profile-media/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT photo_file, photo_mime_type FROM users WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length || !rows[0].photo_file) return res.status(404).end();
  res.type(rows[0].photo_mime_type || "image/png");
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(path.join(PROFILE_UPLOAD_DIR, rows[0].photo_file));
});

app.get("/api/state", async (req, res) => {
  const userId = req.get("X-KAILA-User-Id");
  const [rows] = userId ? await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]) : [[]];
  res.json(await getState(rows.length ? mapUser(rows[0]) : null));
});

app.post("/api/register", async (req, res) => {
  let user;
  try {
    user = await createAccount(req.body, ["client", "provider"]);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || "Registration failed" });
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

app.post("/api/forgot-password", async (req, res) => {
  res.status(410).json({ error: "Self-service password reset is disabled for pilot account safety" });
});

app.post("/api/profile", requireUser, async (req, res) => {
  try {
    const { name, area, category, photo, contactNumber, messengerLink, preferredContactChannel, bestContactTime, dataPrivacyConsent } = req.body || {};
    const cleanName = String(name || "").trim();
    const cleanArea = String(area || "").trim();
    const cleanCategory = normalizeCategories(category);
    if (!cleanName || !cleanArea) return res.status(400).json({ error: "Name and area are required" });

    let photoUpdate = "";
    let photoParams = [];
    if (photo) {
      const decoded = decodeProfilePhoto(photo);
      const fileName = `${req.user.id}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}${decoded.extension}`;
      const [currentRows] = await pool.query("SELECT photo_file FROM users WHERE id = ? LIMIT 1", [req.user.id]);
      await fs.promises.writeFile(path.join(PROFILE_UPLOAD_DIR, fileName), decoded.buffer);
      const oldFile = currentRows[0]?.photo_file;
      if (oldFile && oldFile !== fileName) await fs.promises.unlink(path.join(PROFILE_UPLOAD_DIR, oldFile)).catch(() => {});
      photoUpdate = ", photo_file = ?, photo_mime_type = ?";
      photoParams = [fileName, decoded.mimeType];
    }

    await pool.query(
      `UPDATE users SET name = ?, area = ?, category = ?, contact_number = ?, messenger_link = ?, preferred_contact_channel = ?, best_contact_time = ?, data_privacy_consent = ?${photoUpdate} WHERE id = ?`,
      [
        cleanName,
        cleanArea,
        cleanCategory,
        String(contactNumber || "").trim(),
        String(messengerLink || "").trim(),
        String(preferredContactChannel || "").trim(),
        String(bestContactTime || "").trim(),
        boolField(dataPrivacyConsent) ? 1 : 0,
        ...photoParams,
        req.user.id,
      ]
    );
    await pool.query("UPDATE providers SET name = ?, area = ?, category = COALESCE(NULLIF(?, ''), category), updated_at = ? WHERE user_id = ?", [
      cleanName,
      cleanArea,
      cleanCategory,
      nowMysql(),
      req.user.id,
    ]);

    const updated = await getUser(req.user.id);
    await addActivity("Profile updated", `${updated.name} updated profile settings`);
    const state = await getStateFor(updated);
    broadcast("kaila.state.updated", state);
    res.json({ user: publicUser(updated), state });
  } catch (error) {
    console.error("Profile update failed:", error);
    res.status(400).json({ error: error.message || "Profile update failed" });
  }
});

app.post("/api/providers", requireUser, async (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can save provider profiles" });
  const {
    category, area, availability, skills, displayName, providerType, specificServices, yearsExperience, coverageArea,
    emergencyAvailability, availableDays, availableTime, travelLimits, minimumFee, priceRange, workSamples,
    certificateProof, validIdConsent, consentRequests, consentRatings, rulesAgreement,
  } = req.body || {};
  const cleanCategory = normalizeCategories(category);
  if (!cleanCategory || !area) return res.status(400).json({ error: "At least one category and area are required" });
  if (!String(specificServices || skills || "").trim() || !String(coverageArea || "").trim() || !boolField(consentRequests) || !boolField(consentRatings) || !boolField(rulesAgreement)) {
    return res.status(400).json({ error: "Specific services, coverage area, request consent, rating consent, and rules agreement are required" });
  }
  const timestamp = nowMysql();
  const providerId = createId();

  await pool.query(
    `INSERT INTO providers (
      id, user_id, name, category, area, availability, skills, display_name, provider_type,
      specific_services, years_experience, coverage_area, emergency_availability, available_days,
      available_time, travel_limits, minimum_fee, price_range, work_samples, certificate_proof,
      valid_id_consent, consent_requests, consent_ratings, rules_agreement, trust_level, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), category = VALUES(category), area = VALUES(area), availability = VALUES(availability), skills = VALUES(skills),
      display_name = VALUES(display_name), provider_type = VALUES(provider_type), specific_services = VALUES(specific_services),
      years_experience = VALUES(years_experience), coverage_area = VALUES(coverage_area), emergency_availability = VALUES(emergency_availability),
      available_days = VALUES(available_days), available_time = VALUES(available_time), travel_limits = VALUES(travel_limits),
      minimum_fee = VALUES(minimum_fee), price_range = VALUES(price_range), work_samples = VALUES(work_samples),
      certificate_proof = VALUES(certificate_proof), valid_id_consent = VALUES(valid_id_consent), consent_requests = VALUES(consent_requests),
      consent_ratings = VALUES(consent_ratings), rules_agreement = VALUES(rules_agreement), updated_at = VALUES(updated_at)`,
    [
      providerId, req.user.id, String(displayName || req.user.name).trim(), cleanCategory, area, availability || availableDays || "Available",
      String(skills || specificServices || "").trim(), String(displayName || req.user.name).trim(), String(providerType || "").trim(),
      String(specificServices || skills || "").trim(), String(yearsExperience || "").trim(), String(coverageArea || "").trim(),
      String(emergencyAvailability || "").trim(), String(availableDays || "").trim(), String(availableTime || "").trim(),
      String(travelLimits || "").trim(), String(minimumFee || "").trim(), String(priceRange || "").trim(),
      String(workSamples || "").trim(), String(certificateProof || "").trim(), boolField(validIdConsent) ? 1 : 0,
      boolField(consentRequests) ? 1 : 0, boolField(consentRatings) ? 1 : 0, boolField(rulesAgreement) ? 1 : 0,
      "Listed", "Active", timestamp, timestamp,
    ]
  );
  const [rows] = await pool.query("SELECT * FROM providers WHERE user_id = ? LIMIT 1", [req.user.id]);
  const provider = mapProvider(rows[0]);
  await addActivity("Provider saved", `${provider.name} - ${provider.category}`);
  broadcast("kaila.provider.saved", { provider });
  res.json({ provider, state: await getStateFor(req.user) });
});

app.post("/api/requests", requireUser, async (req, res) => {
  if (req.user.role !== "client") return res.status(403).json({ error: "Only clients can post requests" });
  const {
    category, urgency, area, budget, preferredSchedule, contactMethod, exactLocationNotes,
    permissionToForward, consentToRate, details, attachments = [],
  } = req.body || {};
  if (!category || !area || !details) return res.status(400).json({ error: "Category, area, and details are required" });
  if (!boolField(permissionToForward) || !boolField(consentToRate)) return res.status(400).json({ error: "Permission to forward and rating consent are required" });
  const timestamp = nowMysql();
  const request = {
    id: createId(),
    clientId: req.user.id,
    clientName: req.user.name,
    category,
    urgency: urgency || "Today",
    area,
    budget: budget || "Open",
    preferredSchedule: String(preferredSchedule || "").trim(),
    contactMethod: String(contactMethod || req.user.preferredContactChannel || "").trim(),
    exactLocationNotes: String(exactLocationNotes || "").trim(),
    permissionToForward: boolField(permissionToForward),
    consentToRate: boolField(consentToRate),
    details,
    status: "Posted",
    offers: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await pool.query(
    "INSERT INTO requests (id, client_id, client_name, category, urgency, area, budget, preferred_schedule, contact_method, exact_location_notes, permission_to_forward, consent_to_rate, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      request.id, request.clientId, request.clientName, request.category, request.urgency, request.area, request.budget,
      request.preferredSchedule, request.contactMethod, request.exactLocationNotes, request.permissionToForward ? 1 : 0,
      request.consentToRate ? 1 : 0, request.details, request.status, request.createdAt, request.updatedAt,
    ]
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
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can send offers" });
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!["Posted", "Offers Received", "Countered"].includes(requestRows[0].status)) return res.status(400).json({ error: "This request is no longer accepting offers" });
  const [providerRows] = await pool.query("SELECT category FROM providers WHERE user_id = ? LIMIT 1", [req.user.id]);
  if (!providerRows.length || !hasCategory(providerRows[0].category, requestRows[0].category)) return res.status(403).json({ error: "This request does not match your provider categories" });
  const [passRows] = await pool.query("SELECT request_id FROM request_passes WHERE request_id = ? AND provider_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (passRows.length) return res.status(400).json({ error: "You already passed this request" });
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
  const timestamp = nowMysql();
  await pool.query(
    "INSERT IGNORE INTO request_passes (request_id, provider_id, created_at) VALUES (?, ?, ?)",
    [req.params.id, req.user.id, timestamp]
  );
  await pool.query("DELETE FROM offers WHERE request_id = ? AND provider_id = ?", [req.params.id, req.user.id]);
  const [remainingOffers] = await pool.query("SELECT type FROM offers WHERE request_id = ?", [req.params.id]);
  const nextStatus = remainingOffers.length
    ? (remainingOffers.some((offer) => offer.type === "counter") ? "Countered" : "Offers Received")
    : "Posted";
  await pool.query("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?", [nextStatus, timestamp, req.params.id]);
  broadcast("kaila.request.passed", { requestId: req.params.id, providerId: req.user.id });
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/confirm", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (req.user.role !== "client" || request.client_id !== req.user.id) return res.status(403).json({ error: "Only the client can confirm this job" });
  const offerId = String(req.body?.offerId || "");
  if (!offerId) return res.status(400).json({ error: "Select an offer first" });
  const [offerRows] = await pool.query("SELECT provider_id FROM offers WHERE id = ? AND request_id = ? LIMIT 1", [offerId, req.params.id]);
  if (!offerRows.length) return res.status(400).json({ error: "Cannot confirm without an offer" });
  const [passRows] = await pool.query("SELECT request_id FROM request_passes WHERE request_id = ? AND provider_id = ? LIMIT 1", [req.params.id, offerRows[0].provider_id]);
  if (passRows.length) return res.status(400).json({ error: "This provider already declined the request" });
  const timestamp = nowMysql();
  await pool.query("UPDATE requests SET status = 'Accepted', accepted_provider_id = ?, confirmed_at = ?, updated_at = ? WHERE id = ?", [offerRows[0].provider_id, timestamp, timestamp, req.params.id]);
  await addActivity("Offer accepted", `${request.category} for ${request.client_name}`);
  broadcast("kaila.request.confirmed", { requestId: req.params.id, actorId: req.user.id });
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/action", requireUser, async (req, res) => {
  if (req.user.role === "admin") return res.status(403).json({ error: "Admin cannot interact with job requests" });
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });

  const request = requestRows[0];
  const action = String(req.body?.action || "");
  const note = String(req.body?.note || "").trim();
  const score = Number(req.body?.score || 0);
  const timestamp = nowMysql();
  const isClient = req.user.role === "client" && request.client_id === req.user.id;
  const isProviderForJob = req.user.role === "provider" && request.accepted_provider_id === req.user.id;

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
    if (!isClient) return res.status(403).json({ error: "Only the client can confirm completion" });
    if (request.status !== "Provider Marked Done") return res.status(400).json({ error: "Provider must mark the job done first" });
    nextStatus = "Payment Released";
    extraSql = ", confirmed_at = ?, payment_released_at = ?, rating_deadline_at = ?";
    extraParams = [timestamp, timestamp, futureMysqlDays(RATING_WINDOW_DAYS)];
    activityTitle = "Completion confirmed";
    activityDetail = `${request.category} is completed and payment is released`;
  } else if (action === "rate") {
    if (request.status !== "Payment Released") return res.status(400).json({ error: "Only payment-released jobs can be rated" });
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ error: "Rating must be 1 to 5" });
    if (isClient) {
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
    const clientRated = Boolean(request.client_rated_at) || isClient;
    const providerRated = Boolean(request.provider_rated_at) || (!isClient && isProviderForJob);
    nextStatus = clientRated && providerRated ? "Rated / Closed" : "Payment Released";
  } else if (action === "cancel") {
    if (!isClient) return res.status(403).json({ error: "Only the client can cancel this request" });
    if (["Provider Marked Done", "Payment Released", "Rated", "Cancelled"].includes(request.status)) return res.status(400).json({ error: "This job can no longer be cancelled" });
    nextStatus = "Cancelled";
    activityTitle = "Job cancelled";
    activityDetail = `${request.category}${note ? ` - ${note}` : ""}`;
  } else if (action === "dispute") {
    if (!isClient && !isProviderForJob) return res.status(403).json({ error: "Only involved users can dispute this job" });
    if (!["Accepted", "In Progress", "Provider Marked Done", "Payment Released"].includes(request.status)) return res.status(400).json({ error: "This job cannot be disputed at this stage" });
    if (!note) return res.status(400).json({ error: "Dispute note is required" });
    nextStatus = "Disputed";
    extraSql = ", dispute_note = ?";
    extraParams = [note];
    activityTitle = "Job disputed";
    activityDetail = `${request.category} - ${note}`;
  } else if (action === "request_revision") {
    if (!isClient) return res.status(403).json({ error: "Only the client can request revision" });
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

  if (["provider_complete", "dispute"].includes(action)) {
    try {
      await saveAttachments(req.params.id, action === "dispute" ? "dispute" : "completion", req.body?.attachments || []);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  await pool.query(
    `UPDATE requests SET status = ?, updated_at = ?${extraSql} WHERE id = ?`,
    [nextStatus, timestamp, ...extraParams, req.params.id]
  );
  await addActivity(activityTitle, activityDetail);
  broadcast("kaila.request.action", { requestId: req.params.id, action, status: nextStatus, actorId: req.user.id });
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
  if (req.user.role === "ops") return res.status(403).json({ error: "Ops accounts are limited to validation work" });
  const detail = String(req.body?.detail || "").trim();
  if (!detail) return res.status(400).json({ error: "Message is required" });
  const activity = await addActivity("Team note", `${req.user.name}: ${detail}`);
  res.status(201).json({ activity, state: await getStateFor(req.user) });
});

app.post("/api/validation", requireUser, async (req, res) => {
  if (!["admin", "ops"].includes(req.user.role)) return res.status(403).json({ error: "Admin or ops only" });
  const type = String(req.body?.type || "").trim();
  if (!["client_survey", "provider_interview"].includes(type)) return res.status(400).json({ error: "Invalid validation form type" });
  const responses = req.body?.responses && typeof req.body.responses === "object" ? req.body.responses : {};
  const subjectName = String(req.body?.subjectName || responses.name || responses.providerName || "").trim();
  const area = String(req.body?.area || responses.area || responses.coverageArea || "").trim();
  const category = String(req.body?.category || responses.serviceNeeded || responses.servicesOffered || "").trim();
  const decisionSignal = String(req.body?.decisionSignal || responses.decisionSignal || "").trim();
  const notes = String(req.body?.notes || responses.notes || "").trim();
  if (!subjectName || !area) return res.status(400).json({ error: "Name and area are required" });
  if (JSON.stringify(responses).length > 12000) return res.status(400).json({ error: "Validation entry is too long" });

  const entry = {
    id: createId(),
    type,
    operatorId: req.user.id,
    operatorName: req.user.name,
    subjectName,
    area,
    category,
    decisionSignal,
    responses,
    notes,
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO validation_entries (id, type, operator_id, operator_name, subject_name, area, category, decision_signal, responses, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [entry.id, entry.type, entry.operatorId, entry.operatorName, entry.subjectName, entry.area, entry.category, entry.decisionSignal, JSON.stringify(entry.responses), entry.notes, entry.createdAt]
  );
  await addActivity(type === "client_survey" ? "Client survey recorded" : "Provider interview recorded", `${req.user.name}: ${entry.subjectName} - ${entry.decisionSignal || "No decision signal"}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", await getState());
  res.status(201).json({ entry, state });
});

app.post("/api/admin/users", requireUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  let user;
  try {
    user = await createAccount(req.body, ["client", "provider", "ops"]);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || "Account creation failed" });
  }
  await addActivity("Account created", `${req.user.name} created ${user.name} as ${user.role}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", state);
  res.status(201).json({ user: publicUser(user), state });
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
  await pool.query("TRUNCATE TABLE validation_entries");
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

  socket.on("identify", async (userId) => {
    try {
      const user = await getUser(userId);
      if (socket.data.userId) socket.leave(`user:${socket.data.userId}`);
      socket.data.userId = user?.id || "";
      if (!user) return;
      socket.join(`user:${user.id}`);
      socket.emit("kaila.socket.identified", { userId: user.id });
    } catch (error) {
      console.error("Socket identity failed:", error);
    }
  });

  socket.on("kaila.call.check", async (payload = {}, acknowledge = () => {}) => {
    try {
      const user = await getUser(socket.data.userId);
      if (!user) throw new Error("Sign in before starting a call");
      const requestId = String(payload.requestId || "");
      const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
      if (!requestRows.length || !canWriteConversation(requestRows[0], user)) {
        throw new Error("Audio calls are only available while the confirmed job conversation is active");
      }
      const targetUserId = otherConversationUserId(requestRows[0], user.id);
      acknowledge({ ok: Boolean(targetUserId && await userSocketCount(targetUserId)) });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "Could not check call availability" });
    }
  });

  socket.on("kaila.call.signal", async (payload = {}, acknowledge = () => {}) => {
    try {
      const user = await getUser(socket.data.userId);
      if (!user) throw new Error("Sign in before starting a call");
      const requestId = String(payload.requestId || "");
      const callId = String(payload.callId || "");
      const type = String(payload.type || "");
      if (!requestId || !callId || !["offer", "answer", "candidate", "renegotiate", "video-stalled", "hangup", "reject", "busy"].includes(type)) {
        throw new Error("Invalid call signal");
      }
      const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
      if (!requestRows.length || !canWriteConversation(requestRows[0], user)) {
        throw new Error("Audio calls are only available while the confirmed job conversation is active");
      }
      const targetUserId = otherConversationUserId(requestRows[0], user.id);
      if (!targetUserId) throw new Error("Call recipient not found");
      if (!await userSocketCount(targetUserId)) {
        activeCalls.delete(callId);
        return acknowledge({ ok: false, code: "recipient_offline", error: "The other party is offline" });
      }
      if (type === "offer") {
        activeCalls.set(callId, {
          requestId,
          userIds: [user.id, targetUserId],
          answeredBySocketId: "",
          answeredByUserId: "",
          declinedSocketIds: new Set(),
        });
      }
      const activeCall = activeCalls.get(callId);
      if (type === "answer") {
        if (activeCall?.answeredByUserId === user.id && activeCall.answeredBySocketId && activeCall.answeredBySocketId !== socket.id) {
          return acknowledge({ ok: false, code: "answered_elsewhere", error: "This call was answered on another device" });
        }
        if (activeCall && !activeCall.answeredBySocketId) {
          activeCall.answeredBySocketId = socket.id;
          activeCall.answeredByUserId = user.id;
          socket.to(`user:${user.id}`).emit("kaila.call.signal", {
            requestId,
            callId,
            type: "answered-elsewhere",
            senderId: user.id,
            senderName: user.name,
          });
        }
      }
      if (type === "reject" && activeCall?.answeredBySocketId && activeCall.answeredBySocketId !== socket.id) {
        return acknowledge({ ok: true });
      }
      if (type === "reject" && activeCall && !activeCall.answeredBySocketId) {
        activeCall.declinedSocketIds.add(socket.id);
        const userSockets = await io.in(`user:${user.id}`).fetchSockets();
        if (userSockets.some((item) => !activeCall.declinedSocketIds.has(item.id))) return acknowledge({ ok: true });
      }
      if (["hangup", "reject", "busy"].includes(type)) activeCalls.delete(callId);
      relayCallSignal(targetUserId, {
        requestId,
        callId,
        type,
        senderId: user.id,
        senderName: user.name,
        description: payload.description || null,
        candidate: payload.candidate || null,
        withVideo: Boolean(payload.withVideo),
      });
      acknowledge({ ok: true });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "Call signal failed" });
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    setTimeout(() => endDisconnectedUserCalls(userId).catch((error) => console.error("Call disconnect cleanup failed:", error)), 0);
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
