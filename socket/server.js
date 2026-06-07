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
let firebaseAdmin = null;
try {
  firebaseAdmin = require("firebase-admin");
} catch {
  firebaseAdmin = null;
}

const app = express();
const server = http.createServer(app);
const socketOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};
const io = new Server(server, socketOptions);
const proxiedIo = new Server(server, { ...socketOptions, path: "/kaila-api/socket.io" });
const socketServers = [io, proxiedIo];

const PORT = Number(process.env.PORT || 6002);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const CHANNEL = "kaila-mvp";
const SOCKET_TOKEN = sanitizeToken(process.env.KAILA_SOCKET_BEARER_TOKEN || "kaila_mvp_secret_token");
const MESSAGE_ENCRYPTION_KEY = parseMessageEncryptionKey(process.env.KAILA_MESSAGE_ENCRYPTION_KEY);
const AUTO_CONFIRM_HOURS = Number(process.env.KAILA_AUTO_CONFIRM_HOURS || 48);
const RATING_WINDOW_DAYS = Number(process.env.KAILA_RATING_WINDOW_DAYS || 7);
const CALL_RING_TIMEOUT_MS = Number(process.env.KAILA_CALL_RING_TIMEOUT_MS || 60000);
const CALL_DISCONNECT_GRACE_MS = Number(process.env.KAILA_CALL_DISCONNECT_GRACE_MS || 20000);
const FIREBASE_SERVICE_ACCOUNT_JSON = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
const GROQ_API_KEY = sanitizeToken(process.env.GROQ_API_KEY || "");
const GROQ_MODEL = sanitizeToken(process.env.GROQ_MODEL || "llama-3.1-8b-instant");
const ROUTE_DISTANCE_URL = sanitizeToken(process.env.KAILA_ROUTE_DISTANCE_URL || "https://router.project-osrm.org/route/v1/driving");
const ROUTE_DISTANCE_CACHE_MS = Number(process.env.KAILA_ROUTE_DISTANCE_CACHE_MS || 6 * 60 * 60 * 1000);
const MOBILE_UPDATE_VERSION_CODE = Number(process.env.KAILA_ANDROID_LATEST_VERSION_CODE || 0);
const MOBILE_UPDATE_VERSION_NAME = sanitizeToken(process.env.KAILA_ANDROID_LATEST_VERSION_NAME || "");
const MOBILE_UPDATE_APK_URL = sanitizeToken(process.env.KAILA_ANDROID_APK_URL || "");
const MOBILE_UPDATE_RELEASE_NOTES = sanitizeToken(process.env.KAILA_ANDROID_RELEASE_NOTES || "");
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
const directConversationPresence = new Map();
const activeCalls = new Map();
const routeDistanceCache = new Map();
let firebaseMessaging = null;

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

function initializePushMessaging() {
  if (!firebaseAdmin || firebaseMessaging) return;
  try {
    if (FIREBASE_SERVICE_ACCOUNT_JSON) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
    } else {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
      });
    }
    firebaseMessaging = firebaseAdmin.messaging();
  } catch (error) {
    firebaseMessaging = null;
    console.warn("KAILA push notifications disabled:", error.message);
  }
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

function validationDecisionPrompt(type, responses) {
  const formName = type === "provider_interview" ? "provider interview" : "client survey";
  return [
    {
      role: "system",
      content: [
        "You classify KAILA local-services marketplace validation evidence.",
        "Return only one JSON object with keys decisionSignal and reason.",
        "decisionSignal must be exactly one of: Strong positive, Positive, Neutral, Concern, Blocker.",
        "Use Strong positive for clear real demand/supply and willingness to use KAILA.",
        "Use Positive for useful support with minor uncertainty.",
        "Use Neutral for weak, incomplete, or mixed evidence.",
        "Use Concern for adoption, trust, pricing, operations, or provider-fit risks.",
        "Use Blocker for clear evidence the workflow cannot work or should not proceed for this case.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({ form: formName, responses }, null, 2),
    },
  ];
}

function analyticsPrompt(metrics, samples) {
  return [
    {
      role: "system",
      content: [
        "You are KAILA's concise marketplace ops analyst for Gingoog City.",
        "Return only one JSON object with keys summary, risks, actions.",
        "summary must be one short sentence.",
        "risks and actions must be arrays of 1 to 3 short strings each.",
        "Base the insight only on the supplied metrics and samples.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({ metrics, samples }, null, 2),
    },
  ];
}

async function groqChatJson(messages, fallback) {
  if (!GROQ_API_KEY) {
    const error = new Error("Groq API key is not configured");
    error.status = 503;
    throw error;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.1,
        max_completion_tokens: 400,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || "Groq request failed");
      error.status = response.status;
      throw error;
    }
    const content = payload.choices?.[0]?.message?.content || "";
    return JSON.parse(content);
  } catch (error) {
    if (fallback) return fallback(error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDecisionSignal(value) {
  const match = ["Strong positive", "Positive", "Neutral", "Concern", "Blocker"]
    .find((option) => option.toLowerCase() === String(value || "").trim().toLowerCase());
  return match || "Neutral";
}

function localDecisionSignal(type, responses = {}) {
  if (type === "provider_interview") {
    let score = 0;
    if (responses.wantsMoreClients === "Yes") score += 2;
    if (responses.comfortableSubmittingOffers === "Yes") score += 2;
    if (responses.comfortableSubmittingOffers === "No") score -= 2;
    if (responses.wantsMoreClients === "No") score -= 2;
    if (responses.ratingConcerns) score -= 1;
    if (responses.jobsAvoided) score -= 1;
    if (responses.servicesOffered && responses.coverageArea) score += 1;
    if (score >= 4) return "Strong positive";
    if (score >= 2) return "Positive";
    if (score <= -3) return "Blocker";
    if (score <= -1) return "Concern";
    return "Neutral";
  }
  let score = 0;
  if (responses.neededProvider === "Yes") score += 1;
  if (["3-7 days", "More than a week", "Never found one"].includes(responses.timeToFind)) score += 1;
  if (responses.wouldPostRequest === "Yes") score += 2;
  if (responses.wouldPostRequest === "No") score -= 2;
  if (responses.wouldCompareOffers === "Yes") score += 1;
  if (responses.wouldUploadMedia === "No") score -= 1;
  if (responses.wouldRateProvider === "No") score -= 1;
  if (score >= 4) return "Strong positive";
  if (score >= 2) return "Positive";
  if (score <= -3) return "Blocker";
  if (score <= -1) return "Concern";
  return "Neutral";
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
  const target = String(category || "").trim().toLowerCase();
  return normalizeCategories(categories).split(",").map((item) => item.trim().toLowerCase()).includes(target);
}

async function activeProviderProfileFor(userId) {
  if (!userId) return null;
  const [rows] = await pool.query("SELECT * FROM providers WHERE user_id = ? AND status = 'Active' LIMIT 1", [userId]);
  return rows[0] || null;
}

function canUseMarketplaceRole(user) {
  return ["client", "provider"].includes(user?.role);
}

function normalizeAccountRole(role) {
  const cleanRole = String(role || "").trim().toLowerCase();
  if (["customer_service", "customer-service", "customer service", "support"].includes(cleanRole)) return "customer_service";
  return cleanRole === "ops" ? "ops" : cleanRole;
}

function boolField(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase()) || value === true;
}

function coordinateField(value, min, max) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return null;
  return Math.round(numeric * 10000000) / 10000000;
}

function locationPayload(value = {}) {
  const lat = coordinateField(value.lat ?? value.latitude, -90, 90);
  const lng = coordinateField(value.lng ?? value.longitude, -180, 180);
  if (lat === null || lng === null) return { lat: null, lng: null };
  return { lat, lng };
}

function routeCacheKey(from, to) {
  return [from, to].map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|");
}

async function lookupRouteDistanceKm(from, to) {
  const key = routeCacheKey(from, to);
  const cached = routeDistanceCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const base = ROUTE_DISTANCE_URL.replace(/\/$/, "");
    const url = `${base}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&alternatives=false&steps=false`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.code !== "Ok" || !payload.routes?.length) {
      const error = new Error(payload.message || "Route distance unavailable");
      error.status = response.status || 502;
      throw error;
    }
    const distanceKm = Math.round((Number(payload.routes[0].distance) / 1000) * 10) / 10;
    const value = { distanceKm, source: "route" };
    routeDistanceCache.set(key, { value, expiresAt: Date.now() + ROUTE_DISTANCE_CACHE_MS });
    return value;
  } finally {
    clearTimeout(timeout);
  }
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
  return maskStaffUser(safe);
}

function isStaffRole(role) {
  return ["admin", "ops", "customer_service"].includes(role);
}

function staffDisplayName(role) {
  if (role === "admin") return "KAILA Admin";
  if (role === "ops") return "KAILA Ops";
  if (role === "customer_service") return "KAILA Customer Service";
  return "";
}

function maskStaffUser(user = {}) {
  if (!isStaffRole(user.role)) return user;
  return {
    ...user,
    name: staffDisplayName(user.role) || "KAILA Staff",
    contactNumber: "",
    messengerLink: "",
    preferredContactChannel: "",
    bestContactTime: "",
    photoUrl: user.role === "customer_service" ? user.photoUrl : "",
    reputation: emptyReputation(),
  };
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
      role ENUM('client','provider','admin','ops','customer_service') NOT NULL,
      area VARCHAR(190) NOT NULL,
      category VARCHAR(160) NULL,
      contact_number VARCHAR(80) NULL,
      messenger_link VARCHAR(255) NULL,
      preferred_contact_channel VARCHAR(80) NULL,
      best_contact_time VARCHAR(120) NULL,
      data_privacy_consent TINYINT(1) NOT NULL DEFAULT 0,
      deleted_at DATETIME NULL,
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
  await ensureColumn("users", "deleted_at", "DATETIME NULL");
  await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('client','provider','admin','ops','customer_service') NOT NULL");
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
      job_lat DECIMAL(10, 7) NULL,
      job_lng DECIMAL(10, 7) NULL,
      job_location_source VARCHAR(40) NULL,
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
  await ensureColumn("requests", "job_lat", "DECIMAL(10, 7) NULL");
  await ensureColumn("requests", "job_lng", "DECIMAL(10, 7) NULL");
  await ensureColumn("requests", "job_location_source", "VARCHAR(40) NULL");
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
      provider_lat DECIMAL(10, 7) NULL,
      provider_lng DECIMAL(10, 7) NULL,
      provider_location_captured_at DATETIME NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT offers_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT offers_provider_fk FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("offers", "provider_lat", "DECIMAL(10, 7) NULL");
  await ensureColumn("offers", "provider_lng", "DECIMAL(10, 7) NULL");
  await ensureColumn("offers", "provider_location_captured_at", "DATETIME NULL");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      token TEXT NOT NULL,
      token_hash VARCHAR(128) NOT NULL UNIQUE,
      platform VARCHAR(40) NOT NULL DEFAULT 'android',
      device_id VARCHAR(120) NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      CONSTRAINT push_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("push_tokens", "platform", "VARCHAR(40) NOT NULL DEFAULT 'android'");
  await ensureColumn("push_tokens", "device_id", "VARCHAR(120) NULL");
  await ensureIndex("push_tokens", "push_tokens_hash_unique", "token_hash", true);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_blocks (
      blocker_id VARCHAR(64) NOT NULL,
      blocked_id VARCHAR(64) NOT NULL,
      reason TEXT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (blocker_id, blocked_id),
      INDEX user_blocks_blocked_idx (blocked_id),
      CONSTRAINT user_blocks_blocker_fk FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT user_blocks_blocked_fk FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moderation_reports (
      id VARCHAR(64) PRIMARY KEY,
      reporter_id VARCHAR(64) NOT NULL,
      reported_user_id VARCHAR(64) NULL,
      request_id VARCHAR(64) NULL,
      type ENUM('user','job') NOT NULL,
      reason VARCHAR(160) NOT NULL,
      details TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'Open',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX moderation_reports_status_idx (status, created_at),
      INDEX moderation_reports_reporter_idx (reporter_id, created_at),
      CONSTRAINT moderation_reports_reporter_fk FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT moderation_reports_user_fk FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT moderation_reports_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
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
      kind VARCHAR(24) NOT NULL DEFAULT 'text',
      call_metadata TEXT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT job_messages_request_fk FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT job_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("job_messages", "kind", "VARCHAR(24) NOT NULL DEFAULT 'text'");
  await ensureColumn("job_messages", "call_metadata", "TEXT NULL");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_message_attachments (
      id VARCHAR(64) PRIMARY KEY,
      message_id VARCHAR(64) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL,
      size_bytes INT NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT job_message_attachments_message_fk FOREIGN KEY (message_id) REFERENCES job_messages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await encryptExistingMessages();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id VARCHAR(64) PRIMARY KEY,
      sender_id VARCHAR(64) NOT NULL,
      recipient_id VARCHAR(64) NOT NULL,
      sender_name VARCHAR(160) NOT NULL,
      detail TEXT NOT NULL,
      kind VARCHAR(24) NOT NULL DEFAULT 'text',
      call_metadata TEXT NULL,
      created_at DATETIME NOT NULL,
      INDEX direct_messages_pair_idx (sender_id, recipient_id, created_at),
      CONSTRAINT direct_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT direct_messages_recipient_fk FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn("direct_messages", "kind", "VARCHAR(24) NOT NULL DEFAULT 'text'");
  await ensureColumn("direct_messages", "call_metadata", "TEXT NULL");
  await ensureColumn("direct_messages", "request_id", "VARCHAR(64) NULL");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS direct_message_attachments (
      id VARCHAR(64) PRIMARY KEY,
      message_id VARCHAR(64) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL,
      size_bytes INT NOT NULL,
      created_at DATETIME NOT NULL,
      CONSTRAINT direct_message_attachments_message_fk FOREIGN KEY (message_id) REFERENCES direct_messages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await encryptExistingDirectMessages();
  await cleanupOrphanUploads();
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS missed_calls (
      id VARCHAR(64) PRIMARY KEY,
      caller_id VARCHAR(64) NOT NULL,
      caller_name VARCHAR(160) NOT NULL,
      recipient_id VARCHAR(64) NOT NULL,
      request_id VARCHAR(64) NULL,
      direct_user_id VARCHAR(64) NULL,
      call_type VARCHAR(20) NOT NULL,
      context_title VARCHAR(180) NULL,
      created_at DATETIME NOT NULL,
      INDEX missed_calls_recipient_idx (recipient_id, created_at),
      CONSTRAINT missed_calls_caller_fk FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT missed_calls_recipient_fk FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
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

async function encryptExistingDirectMessages() {
  const [rows] = await pool.query("SELECT id, detail FROM direct_messages");
  for (const row of rows) {
    if (String(row.detail || "").startsWith("enc:v1:")) {
      decryptMessage(row.detail, row.id);
      continue;
    }
    await pool.query("UPDATE direct_messages SET detail = ? WHERE id = ?", [encryptMessage(row.detail, row.id), row.id]);
  }
}

function emptyReputation() {
  return { average: null, count: 0 };
}

function mapUser(row, reputation = emptyReputation()) {
  if (!row) return null;
  const photoVersion = row.photo_file ? encodeURIComponent(row.photo_file) : "";
  const staffRole = isStaffRole(row.role);
  return {
    id: row.id,
    name: staffRole ? staffDisplayName(row.role) : row.name,
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
    reputation: staffRole ? emptyReputation() : reputation,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
  };
}

function displayNameForUser(user = {}) {
  if (isStaffRole(user.role)) return staffDisplayName(user.role);
  return user.name || "KAILA user";
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

async function pushTokensForUsers(userIds = []) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return [];
  const [rows] = await pool.query(`SELECT user_id, token, token_hash FROM push_tokens WHERE user_id IN (${ids.map(() => "?").join(",")})`, ids);
  return rows;
}

async function sendPushToUsers(userIds = [], payload = {}) {
  if (!firebaseMessaging) {
    console.warn("KAILA push skipped: Firebase messaging is not initialized.");
    return { sent: 0, tokenCount: 0, reason: "firebase_unavailable" };
  }
  const rows = await pushTokensForUsers(userIds);
  if (!rows.length) return { sent: 0, tokenCount: 0, reason: "no_tokens" };
  let sent = 0;
  await Promise.all(rows.map(async (row) => {
    try {
      const message = {
        token: row.token,
        data: Object.fromEntries(Object.entries(payload.data || {}).map(([key, value]) => [key, String(value ?? "")])),
        android: {
          priority: "high",
          ttl: payload.ttl || 60 * 60 * 1000,
        },
      };
      await firebaseMessaging.send(message);
      sent += 1;
    } catch (error) {
      const code = error?.errorInfo?.code || error?.code || "";
      if (["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(code)) {
        await pool.query("DELETE FROM push_tokens WHERE token_hash = ?", [row.token_hash]);
      } else {
        console.warn("KAILA push send failed:", code || error.message);
      }
    }
  }));
  return { sent, tokenCount: rows.length };
}

async function pushNotification(userIds, { type, title, body, data = {}, ttl } = {}) {
  return sendPushToUsers(userIds, {
    ttl,
    title,
    body,
    channelId: type === "call" ? "kaila-calls" : type === "request" ? "kaila-job-alerts-v3" : "kaila-updates",
    sound: type === "call" ? "kaila_call" : type === "request" ? "kaila_job_alert" : "kaila_notification",
    vibrateTimingsMillis: type === "call" || type === "request" ? [500, 100, 500, 100, 700] : [280, 90, 280],
    tag: data.requestId || data.callId || data.messageId || type,
    data: {
      type,
      title,
      body,
      action: type,
      ...data,
    },
  });
}

function clearJobRequestNotification(userIds, requestId) {
  return pushNotification(userIds, {
    type: "request-clear",
    title: "",
    body: "",
    ttl: 10 * 60 * 1000,
    data: {
      action: "clear-job-request",
      requestId,
    },
  });
}

async function providerUserIdsForRequestCategory(category) {
  const [rows] = await pool.query("SELECT user_id, category FROM providers WHERE status = 'Active'");
  return rows.filter((row) => hasCategory(row.category, category)).map((row) => row.user_id);
}

async function requestAlertUserIds(request = {}) {
  const providerIds = await providerUserIdsForRequestCategory(request.category);
  return Array.from(new Set([...providerIds, request.accepted_provider_id].filter(Boolean)));
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
    providerLocation: row.provider_lat !== null && row.provider_lng !== null ? {
      lat: Number(row.provider_lat),
      lng: Number(row.provider_lng),
      capturedAt: row.provider_location_captured_at || "",
    } : null,
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

function mapDirectAttachment(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    url: `/direct-media/${encodeURIComponent(row.id)}`,
    createdAt: row.created_at,
  };
}

function mapJobMessageAttachment(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    url: `/message-media/${encodeURIComponent(row.id)}`,
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

async function saveDirectAttachments(messageId, attachments = []) {
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
        "INSERT INTO direct_message_attachments (id, message_id, file_name, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, messageId, fileName, sanitizedAttachmentName(attachment.name, decoded.extension, id), decoded.mimeType, decoded.buffer.length, nowMysql()]
      );
    }
  } catch (error) {
    for (const attachment of saved) {
      await pool.query("DELETE FROM direct_message_attachments WHERE id = ?", [attachment.id]);
      await fs.promises.unlink(path.join(UPLOAD_DIR, attachment.fileName)).catch(() => {});
    }
    throw error;
  }
}

async function saveJobMessageAttachments(messageId, attachments = []) {
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
        "INSERT INTO job_message_attachments (id, message_id, file_name, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, messageId, fileName, sanitizedAttachmentName(attachment.name, decoded.extension, id), decoded.mimeType, decoded.buffer.length, nowMysql()]
      );
    }
  } catch (error) {
    for (const attachment of saved) {
      await pool.query("DELETE FROM job_message_attachments WHERE id = ?", [attachment.id]);
      await fs.promises.unlink(path.join(UPLOAD_DIR, attachment.fileName)).catch(() => {});
    }
    throw error;
  }
}

async function cleanupOrphanUploads() {
  const [requestRows] = await pool.query("SELECT file_name FROM request_attachments");
  const [jobMessageRows] = await pool.query("SELECT file_name FROM job_message_attachments");
  const [directMessageRows] = await pool.query("SELECT file_name FROM direct_message_attachments");
  const referenced = new Set([...requestRows, ...jobMessageRows, ...directMessageRows].map((row) => row.file_name));
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
    jobLocation: row.job_lat !== null && row.job_lng !== null ? {
      lat: Number(row.job_lat),
      lng: Number(row.job_lng),
      source: row.job_location_source || "current",
    } : null,
    jobLocationSource: row.job_location_source || "",
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
    operatorName: isStaffRole(row.operator_role) ? staffDisplayName(row.operator_role) : row.operator_name,
    subjectName: row.subject_name || "",
    area: row.area || "",
    category: row.category || "",
    decisionSignal: row.decision_signal || "",
    responses,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function validationPayload(input = {}) {
  const type = String(input?.type || "").trim();
  if (!["client_survey", "provider_interview"].includes(type)) {
    const error = new Error("Invalid validation form type");
    error.status = 400;
    throw error;
  }
  const responses = input?.responses && typeof input.responses === "object" ? input.responses : {};
  const subjectName = String(input?.subjectName || responses.name || responses.providerName || "").trim();
  const area = String(input?.area || responses.area || responses.coverageArea || "").trim();
  const category = String(input?.category || responses.serviceNeeded || responses.servicesOffered || "").trim();
  const decisionSignal = String(input?.decisionSignal || responses.decisionSignal || "").trim();
  const notes = String(input?.notes || responses.notes || "").trim();
  if (!subjectName || !area) {
    const error = new Error("Name and area are required");
    error.status = 400;
    throw error;
  }
  if (JSON.stringify(responses).length > 12000) {
    const error = new Error("Validation entry is too long");
    error.status = 400;
    throw error;
  }
  return { type, responses, subjectName, area, category, decisionSignal, notes };
}

function mapMessage(row, reactions = []) {
  const senderName = isStaffRole(row.sender_role) ? staffDisplayName(row.sender_role) : row.sender_name;
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName,
    detail: decryptMessage(row.detail, row.id),
    createdAt: row.created_at,
    kind: row.kind || "text",
    call: parseCallMetadata(row.call_metadata, row.id),
    reactions,
  };
}

function mapDirectMessage(row) {
  const senderName = isStaffRole(row.sender_role) ? staffDisplayName(row.sender_role) : row.sender_name;
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    requestId: row.request_id || "",
    senderName,
    detail: decryptMessage(row.detail, row.id),
    createdAt: row.created_at,
    kind: row.kind || "text",
    call: parseCallMetadata(row.call_metadata, row.id),
  };
}

function directRequestContext(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    status: row.status,
    urgency: row.urgency,
    area: row.area,
    budget: row.budget,
    clientName: row.client_name,
    details: row.details,
  };
}

async function loadDirectRequestContext(requestId, user, target) {
  if (!requestId) return null;
  const [rows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
  if (!rows.length) {
    const error = new Error("Request context not found");
    error.status = 404;
    throw error;
  }
  const request = rows[0];
  const supportInvolved = user.role === "customer_service" || target.role === "customer_service";
  const userIsParty = request.client_id === user.id || request.accepted_provider_id === user.id;
  const targetIsParty = request.client_id === target.id || request.accepted_provider_id === target.id;
  const userCanUseContext = user.role === "customer_service" || user.role === "admin" || userIsParty;
  const targetCanUseContext = target.role === "customer_service" || target.role === "admin" || targetIsParty;
  if (!supportInvolved || !userCanUseContext || !targetCanUseContext) {
    const error = new Error("Request context is not available for these accounts");
    error.status = 403;
    throw error;
  }
  return directRequestContext(request);
}

function parseCallMetadata(value, messageId) {
  if (!value) return null;
  try {
    const detail = String(value || "").startsWith("enc:v1:") ? decryptMessage(value, `${messageId}:call`) : value;
    return JSON.parse(detail);
  } catch {
    return null;
  }
}

function mapMissedCall(row) {
  return {
    id: row.id,
    callerId: row.caller_id,
    callerName: isStaffRole(row.caller_role) ? staffDisplayName(row.caller_role) : row.caller_name,
    recipientId: row.recipient_id,
    requestId: row.request_id || "",
    directUserId: row.direct_user_id || "",
    callType: row.call_type || "audio",
    contextTitle: row.context_title || "",
    createdAt: row.created_at,
  };
}

function directConversationKey(leftUserId, rightUserId) {
  return [leftUserId, rightUserId].sort().join(":");
}

function canInitiateDirectInteraction(user, target) {
  if (!user || !target || user.id === target.id) return false;
  if (user.role === "admin") return ["admin", "ops", "customer_service", "provider", "client"].includes(target.role);
  if (user.role === "customer_service") return ["admin", "customer_service", "provider", "client"].includes(target.role);
  if (target.role === "customer_service") return ["provider", "client"].includes(user.role);
  return user.role === "ops" && target.role === "admin";
}

function canReadDirectConversation(user, target) {
  if (!user || !target || user.id === target.id) return false;
  if (canInitiateDirectInteraction(user, target) || canInitiateDirectInteraction(target, user)) return true;
  return false;
}

async function directConversationHasMessages(leftUserId, rightUserId, requestId = "") {
  const [rows] = await pool.query(
    "SELECT id FROM direct_messages WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) AND (request_id <=> ?) LIMIT 1",
    [leftUserId, rightUserId, rightUserId, leftUserId, requestId || null]
  );
  return Boolean(rows.length);
}

async function canOpenDirectConversation(user, target, requestId = "") {
  if (!canReadDirectConversation(user, target)) return false;
  if (await isBlockedBetween(user.id, target.id)) return false;
  if (canInitiateDirectInteraction(user, target)) return true;
  return directConversationHasMessages(user.id, target.id, requestId);
}

async function canWriteDirectConversation(user, target, requestId = "") {
  if (!canReadDirectConversation(user, target)) return false;
  if (await isBlockedBetween(user.id, target.id)) return false;
  if (canInitiateDirectInteraction(user, target)) return true;
  return directConversationHasMessages(user.id, target.id, requestId);
}

function canInitiateDirectCall(user, target) {
  if (!user || !target || user.id === target.id) return false;
  if (user.role === "customer_service") return ["client", "provider"].includes(target.role);
  if (target.role === "customer_service") return ["client", "provider"].includes(user.role);
  if (user.role === "ops") return target.role === "admin";
  return user.role === "admin" && ["admin", "ops", "customer_service"].includes(target.role);
}

function canReadConversation(request, user) {
  if (user?.role === "customer_service") return Boolean(request.accepted_provider_id);
  return Boolean(request.accepted_provider_id) && (request.client_id === user.id || request.accepted_provider_id === user.id);
}

function canWriteConversation(request, user) {
  if (user.role === "admin" || !canReadConversation(request, user)) return false;
  if (request.status === "Disputed") return false;
  return ["Accepted", "In Progress", "Provider Marked Done", "Revision Requested"].includes(request.status);
}

function supportDisputeNote(request, outcome, note) {
  const existing = String(request.dispute_note || "").trim();
  const resolution = `${outcome}${note ? `: ${note}` : ""}`;
  return existing ? `${existing}\n\nSupport resolution - ${resolution}` : `Support resolution - ${resolution}`;
}

function otherConversationUserId(request, userId) {
  if (request.client_id === userId) return request.accepted_provider_id;
  if (request.accepted_provider_id === userId) return request.client_id;
  return "";
}

function activeDirectConversationUserIds(leftUserId, rightUserId) {
  const cutoff = Date.now() - 45000;
  const key = directConversationKey(leftUserId, rightUserId);
  const room = directConversationPresence.get(key);
  if (!room) return [];
  for (const [userId, seenAt] of room) {
    if (seenAt < cutoff) room.delete(userId);
  }
  if (!room.size) directConversationPresence.delete(key);
  return Array.from(room.keys());
}

async function userSocketCount(userId) {
  const socketGroups = await Promise.all(socketServers.map((socketServer) => socketServer.in(`user:${userId}`).fetchSockets()));
  return socketGroups.reduce((count, sockets) => count + sockets.length, 0);
}

function relayCallSignal(targetUserId, signal) {
  socketServers.forEach((socketServer) => {
    socketServer.to(`user:${targetUserId}`).emit("kaila.call.signal", signal);
  });
}

function relayDirectEvent(userIds, event, payload) {
  socketServers.forEach((socketServer) => {
    userIds.forEach((userId) => socketServer.to(`user:${userId}`).emit(event, payload));
  });
}

async function endDisconnectedUserCalls(userId, disconnectedAt = 0) {
  if (!userId || await userSocketCount(userId)) return;
  for (const [callId, call] of activeCalls) {
    if (!call.userIds.includes(userId)) continue;
    // A stale disconnect timer must not kill a push-notified call created after the app was closed.
    if (disconnectedAt && call.startedAtMs && call.startedAtMs > disconnectedAt) continue;
    const targetUserId = call.userIds.find((id) => id !== userId);
    if (call.answeredByUserId) {
      await recordEndedCall(call);
    } else if (call.callerId && call.targetUserId) {
      const caller = await getUser(call.callerId);
      if (caller) {
        await recordMissedCallForBoth({
          caller,
          targetUserId: call.targetUserId,
          requestId: call.requestId || "",
          directUserId: call.directUserIds?.find((id) => id !== call.callerId) || "",
          callType: call.callType || "audio",
          contextTitle: call.contextTitle || "",
        });
      }
    }
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

function scheduleDisconnectedUserCallCleanup(userId) {
  if (!userId) return;
  const disconnectedAt = Date.now();
  setTimeout(() => endDisconnectedUserCalls(userId, disconnectedAt).catch((error) => {
    console.error("Call disconnect cleanup failed:", error);
  }), CALL_DISCONNECT_GRACE_MS);
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
    ? await pool.query("SELECT entry.*, operator.role AS operator_role FROM validation_entries AS entry LEFT JOIN users AS operator ON operator.id = entry.operator_id ORDER BY entry.created_at DESC LIMIT 200")
    : [[]];
  const [blockRows] = viewer
    ? await pool.query("SELECT blocker_id, blocked_id, reason, created_at FROM user_blocks WHERE blocker_id = ? ORDER BY created_at DESC", [viewer.id])
    : [[]];
  const [reportRows] = ["admin", "customer_service"].includes(viewer?.role)
    ? await pool.query(`
      SELECT report.*, reporter.name AS reporter_name, reporter.role AS reporter_role,
        reported.name AS reported_name, reported.role AS reported_role,
        request.category AS request_category
      FROM moderation_reports AS report
      JOIN users AS reporter ON reporter.id = report.reporter_id
      LEFT JOIN users AS reported ON reported.id = report.reported_user_id
      LEFT JOIN requests AS request ON request.id = report.request_id
      ORDER BY report.created_at DESC
      LIMIT 200
    `)
    : viewer
      ? await pool.query(`
        SELECT report.*, reporter.name AS reporter_name, reporter.role AS reporter_role,
          reported.name AS reported_name, reported.role AS reported_role,
          request.category AS request_category
        FROM moderation_reports AS report
        JOIN users AS reporter ON reporter.id = report.reporter_id
        LEFT JOIN users AS reported ON reported.id = report.reported_user_id
        LEFT JOIN requests AS request ON request.id = report.request_id
        WHERE report.reporter_id = ?
        ORDER BY report.created_at DESC
        LIMIT 50
      `, [viewer.id])
      : [[]];
  const reputations = buildReputations(requestRows);
  const profiles = new Map(userRows.map((row) => [row.id, mapUser(row, reputations.get(row.id) || emptyReputation())]));
  if (viewer?.role === "ops") {
    return {
      users: Array.from(profiles.values()).filter((user) => user.id === viewer.id || user.role === "admin").map(publicUser),
      providers: [],
      requests: [],
      activities: [],
      validationEntries: validationRows.map(mapValidationEntry),
      blocks: blockRows,
      reports: reportRows.map(mapReport),
    };
  }

  const offersByRequest = new Map();
  const acceptedProviderByRequest = new Map(requestRows.map((row) => [row.id, row.accepted_provider_id]));
  const clientByRequest = new Map(requestRows.map((row) => [row.id, row.client_id]));
  const passedOfferKeys = new Set(passRows.map((row) => `${row.request_id}:${row.provider_id}`));
  for (const row of offerRows) {
    if (passedOfferKeys.has(`${row.request_id}:${row.provider_id}`)) continue;
    if (viewer && !["admin", "customer_service"].includes(viewer.role) && clientByRequest.get(row.request_id) !== viewer.id && row.provider_id !== viewer.id) continue;
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
  const viewerProvider = canUseMarketplaceRole(viewer) ? providerRows.find((row) => row.user_id === viewer?.id && row.status === "Active") : null;
  const visibleRequestRows = requestRows.filter((row) => {
    if (!viewer || ["admin", "customer_service"].includes(viewer.role)) return true;
    if (row.client_id === viewer.id || row.accepted_provider_id === viewer.id) return true;
    if (!viewerProvider) return false;
    if (row.accepted_provider_id) return false;
    if (!["Posted", "Offers Received", "Countered"].includes(row.status)) return false;
    if (passedOfferKeys.has(`${row.id}:${viewer.id}`)) return false;
    return hasCategory(viewerProvider.category, row.category);
  });

  return {
    users: Array.from(profiles.values()).map(publicUser),
    providers: providerRows.map((row) => mapProvider(row, reputations.get(row.user_id) || emptyReputation(), profiles.get(row.user_id)?.photoUrl || "")),
    requests: visibleRequestRows.map((row) => mapRequest(row, offersByRequest.get(row.id) || [], passesByRequest.get(row.id) || [], attachmentsByRequest.get(row.id) || [], reputations, profiles)),
    activities: activityRows.map(mapActivity),
    blocks: blockRows,
    reports: reportRows.map(mapReport),
    ...(["admin", "ops"].includes(viewer?.role) ? { validationEntries: validationRows.map(mapValidationEntry) } : {}),
  };
}

function getStateFor(user) {
  return getState(user || null);
}

async function messageSummaryFor(user) {
  if (!user) return { jobMessages: [], directMessages: [] };
  const [jobRows] = await pool.query(
    `
      SELECT message.*, sender.role AS sender_role, request.category
      FROM job_messages AS message
      JOIN users AS sender ON sender.id = message.sender_id
      JOIN requests AS request ON request.id = message.request_id
      JOIN (
        SELECT request_id, MAX(created_at) AS latest_at
        FROM job_messages
        WHERE sender_id <> ?
        GROUP BY request_id
      ) AS latest ON latest.request_id = message.request_id AND latest.latest_at = message.created_at
      WHERE message.sender_id <> ?
        AND request.accepted_provider_id IS NOT NULL
        AND (request.client_id = ? OR request.accepted_provider_id = ?)
      ORDER BY message.created_at DESC
      LIMIT 50
    `,
    [user.id, user.id, user.id, user.id]
  );
  const [directRows] = await pool.query(
    `
      SELECT message.*, sender.role AS sender_role
      FROM direct_messages AS message
      JOIN users AS sender ON sender.id = message.sender_id
      JOIN (
        SELECT sender_id, COALESCE(request_id, '') AS request_key, MAX(created_at) AS latest_at
        FROM direct_messages
        WHERE recipient_id = ?
        GROUP BY sender_id, COALESCE(request_id, '')
      ) AS latest ON latest.sender_id = message.sender_id AND latest.request_key = COALESCE(message.request_id, '') AND latest.latest_at = message.created_at
      WHERE message.recipient_id = ?
      ORDER BY message.created_at DESC
      LIMIT 50
    `,
    [user.id, user.id]
  );
  return {
    jobMessages: jobRows.map((row) => ({ requestId: row.request_id, title: row.category, message: mapMessage(row) })),
    directMessages: directRows.map((row) => {
      const message = mapDirectMessage(row);
      return { userId: row.sender_id, requestId: row.request_id || "", title: message.senderName, message };
    }),
  };
}

async function notificationSummaryFor(user) {
  if (!user || user.role === "ops") return { activities: [], missedCalls: [] };
  const [activityRows] = user.role === "admin" ? await pool.query("SELECT * FROM activities ORDER BY created_at DESC LIMIT 80") : [[]];
  const [missedCallRows] = await pool.query(
    "SELECT call_log.*, caller.role AS caller_role FROM missed_calls AS call_log JOIN users AS caller ON caller.id = call_log.caller_id WHERE call_log.recipient_id = ? ORDER BY call_log.created_at DESC LIMIT 30",
    [user.id]
  );
  return {
    activities: activityRows.map(mapActivity),
    missedCalls: missedCallRows.map(mapMissedCall),
  };
}

async function recordMissedCall({ caller, recipientId, requestId = "", directUserId = "", callType = "audio", contextTitle = "" } = {}) {
  if (!caller?.id || !recipientId) return null;
  const missedCall = {
    id: createId(),
    callerId: caller.id,
    callerName: displayNameForUser(caller),
    recipientId,
    requestId,
    directUserId,
    callType,
    contextTitle,
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO missed_calls (id, caller_id, caller_name, recipient_id, request_id, direct_user_id, call_type, context_title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [missedCall.id, missedCall.callerId, missedCall.callerName, missedCall.recipientId, missedCall.requestId || null, missedCall.directUserId || null, missedCall.callType, missedCall.contextTitle, missedCall.createdAt]
  );
  socketServers.forEach((socketServer) => {
    socketServer.to(`user:${recipientId}`).emit("kaila.missed-call.saved", missedCall);
  });
  pushNotification([recipientId], {
    type: "call",
    title: `Missed KAILA ${callType === "video" ? "video call" : "audio call"}`,
    body: `${missedCall.callerName} tried to call${contextTitle ? ` about ${contextTitle}` : ""}.`,
    data: { action: "open-notifications", callId: missedCall.id, callType, callerName: missedCall.callerName, requestId, directUserId, createdAt: missedCall.createdAt },
  }).catch((error) => console.warn("Missed-call push failed:", error.message));
  return missedCall;
}

async function recordMissedCallForBoth({ caller, targetUserId, requestId = "", directUserId = "", callType = "audio", contextTitle = "" } = {}) {
  if (!caller?.id || !targetUserId) return;
  await recordMissedCall({ caller, recipientId: targetUserId, requestId, directUserId, callType, contextTitle });
  await recordCallLogMessage({
    caller,
    targetUserId,
    requestId,
    directUserId: directUserId || targetUserId,
    callType,
    status: "missed",
    durationSeconds: 0,
    contextTitle,
  });
}

function scheduleCallRingExpiry(callId) {
  setTimeout(async () => {
    try {
      const call = activeCalls.get(callId);
      if (!call || call.answeredByUserId) return;
      const caller = await getUser(call.callerId);
      if (caller) {
        await recordMissedCallForBoth({
          caller,
          targetUserId: call.targetUserId,
          requestId: call.requestId || "",
          directUserId: call.directUserIds?.find((id) => id !== call.callerId) || "",
          callType: call.callType || "audio",
          contextTitle: call.contextTitle || "",
        });
      }
      relayCallSignal(call.callerId, {
        requestId: call.requestId || "",
        directUserId: call.directUserIds?.find((id) => id !== call.callerId) || "",
        callId,
        type: "offline",
        senderId: call.targetUserId,
        senderName: "",
        description: null,
        candidate: null,
        withVideo: call.callType === "video",
      });
      relayCallSignal(call.targetUserId, {
        requestId: call.requestId || "",
        directUserId: call.directUserIds?.find((id) => id !== call.targetUserId) || "",
        callId,
        type: "hangup",
        senderId: call.callerId,
        senderName: call.callerName || "",
        description: null,
        candidate: null,
        withVideo: call.callType === "video",
      });
      activeCalls.delete(callId);
    } catch (error) {
      console.error("Call ring expiry failed:", error);
    }
  }, CALL_RING_TIMEOUT_MS + 1000);
}

function formatCallLogDuration(durationSeconds = 0) {
  const seconds = Math.max(0, Number(durationSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const leftoverMinutes = minutes % 60;
    return `${hours}h ${leftoverMinutes}m`;
  }
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function callLogDetail({ status = "completed", callType = "audio", durationSeconds = 0 } = {}) {
  const label = callType === "video" ? "video call" : "audio call";
  if (status === "missed") return `Missed ${label}`;
  if (status === "declined") return `Declined ${label}`;
  return `${callType === "video" ? "Video" : "Audio"} call ended - ${formatCallLogDuration(durationSeconds)}`;
}

async function recordCallLogMessage({ caller, targetUserId, requestId = "", directUserId = "", callType = "audio", status = "completed", durationSeconds = 0, startedAt = "", answeredAt = "", endedAt = "", contextTitle = "" } = {}) {
  if (!caller?.id || !targetUserId) return null;
  const id = createId();
  const createdAt = endedAt || nowMysql();
  const metadata = {
    callType,
    status,
    callerId: caller.id,
    recipientId: targetUserId,
    durationSeconds: Math.max(0, Number(durationSeconds) || 0),
    startedAt,
    answeredAt,
    endedAt: createdAt,
  };
  const detail = callLogDetail(metadata);
  const activityTitle = status === "completed" ? "Call completed" : "Missed call";
  const callerName = displayNameForUser(caller);
  const activityDetail = `${callerName} ${status === "completed" ? "completed" : "missed"} a ${callType === "video" ? "video" : "audio"} call${contextTitle ? ` for ${contextTitle}` : ""}${status === "completed" ? ` (${formatCallLogDuration(metadata.durationSeconds)})` : ""}`;
  if (requestId) {
    const message = {
      id,
      requestId,
      senderId: caller.id,
      senderName: callerName,
      detail,
      kind: "call",
      call: metadata,
      createdAt,
      reactions: [],
    };
    await pool.query(
      "INSERT INTO job_messages (id, request_id, sender_id, sender_name, detail, kind, call_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [message.id, message.requestId, message.senderId, message.senderName, encryptMessage(message.detail, message.id), message.kind, encryptMessage(JSON.stringify(metadata), `${message.id}:call`), message.createdAt]
    );
    await addActivity(activityTitle, activityDetail);
    broadcast("kaila.message.saved", { requestId, message });
    return message;
  }
  if (directUserId) {
    const message = {
      id,
      senderId: caller.id,
      recipientId: targetUserId,
      senderName: callerName,
      detail,
      kind: "call",
      call: metadata,
      createdAt,
    };
    await pool.query(
      "INSERT INTO direct_messages (id, sender_id, recipient_id, sender_name, detail, kind, call_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [message.id, message.senderId, message.recipientId, message.senderName, encryptMessage(message.detail, message.id), message.kind, encryptMessage(JSON.stringify(metadata), `${message.id}:call`), message.createdAt]
    );
    await addActivity(activityTitle, activityDetail);
    relayDirectEvent([caller.id, targetUserId], "kaila.direct-message.saved", { userIds: [caller.id, targetUserId], message });
    return message;
  }
  return null;
}

async function recordEndedCall(activeCall) {
  if (!activeCall?.callerId || !activeCall.targetUserId || !activeCall.answeredAt) return null;
  const caller = await getUser(activeCall.callerId);
  if (!caller) return null;
  const endedAt = nowMysql();
  const durationSeconds = Math.max(1, Math.round((Date.now() - activeCall.answeredAt) / 1000));
  return recordCallLogMessage({
    caller,
    targetUserId: activeCall.targetUserId,
    requestId: activeCall.requestId || "",
    directUserId: activeCall.directUserIds?.find((userId) => userId !== activeCall.callerId) || "",
    callType: activeCall.callType || "audio",
    status: "completed",
    durationSeconds,
    startedAt: activeCall.startedAt || "",
    answeredAt: activeCall.answeredAtMysql || "",
    endedAt,
    contextTitle: activeCall.contextTitle || "",
  });
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
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1", [id]);
  return mapUser(rows[0]);
}

async function isBlockedBetween(leftUserId, rightUserId) {
  if (!leftUserId || !rightUserId) return false;
  const [rows] = await pool.query(
    "SELECT blocker_id FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1",
    [leftUserId, rightUserId, rightUserId, leftUserId]
  );
  return Boolean(rows.length);
}

function mapReport(row) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: isStaffRole(row.reporter_role) ? staffDisplayName(row.reporter_role) : row.reporter_name,
    reportedUserId: row.reported_user_id || "",
    reportedUserName: row.reported_user_id ? (isStaffRole(row.reported_role) ? staffDisplayName(row.reported_role) : row.reported_name) : "",
    requestId: row.request_id || "",
    requestCategory: row.request_category || "",
    type: row.type,
    reason: row.reason,
    details: row.details || "",
    status: row.status || "Open",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  const area = role === "ops"
    ? (String(input.area || "").trim() || "Operations")
    : role === "customer_service"
      ? (String(input.area || "").trim() || "Customer Service")
      : String(input.area || "").trim();
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
  socketServers.forEach((socketServer) => {
    socketServer.to(CHANNEL).emit(event, data);
  });
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

app.get("/direct-media/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT file_name, mime_type FROM direct_message_attachments WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).end();
  res.type(rows[0].mime_type);
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(path.join(UPLOAD_DIR, rows[0].file_name));
});

app.get("/message-media/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT file_name, mime_type FROM job_message_attachments WHERE id = ? LIMIT 1", [req.params.id]);
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

app.get("/api/message-summary", requireUser, async (req, res) => {
  res.json(await messageSummaryFor(req.user));
});

app.get("/api/notification-summary", requireUser, async (req, res) => {
  res.json(await notificationSummaryFor(req.user));
});

app.get("/api/mobile-update", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.json({
    enabled: MOBILE_UPDATE_VERSION_CODE > 0 && Boolean(MOBILE_UPDATE_APK_URL),
    latestVersionCode: MOBILE_UPDATE_VERSION_CODE,
    latestVersionName: MOBILE_UPDATE_VERSION_NAME,
    apkUrl: MOBILE_UPDATE_APK_URL,
    releaseNotes: MOBILE_UPDATE_RELEASE_NOTES,
  });
});

app.get("/api/route-distance", requireUser, async (req, res) => {
  const from = locationPayload({ lat: req.query.fromLat, lng: req.query.fromLng });
  const to = locationPayload({ lat: req.query.toLat, lng: req.query.toLng });
  if (from.lat === null || to.lat === null) return res.status(400).json({ error: "Valid start and destination coordinates are required" });
  try {
    res.json(await lookupRouteDistanceKm(from, to));
  } catch (error) {
    console.warn("Route distance lookup failed:", error.message);
    res.status(502).json({ error: "Route distance unavailable" });
  }
});

app.post("/api/push-token", requireUser, async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const platform = String(req.body?.platform || "android").trim().slice(0, 40) || "android";
  const deviceId = String(req.body?.deviceId || "").trim().slice(0, 120);
  if (!token || token.length < 20) return res.status(400).json({ error: "Push token is required" });
  const hash = tokenHash(token);
  const timestamp = nowMysql();
  if (deviceId) {
    await pool.query("DELETE FROM push_tokens WHERE device_id = ? AND token_hash <> ?", [deviceId, hash]);
  }
  await pool.query(
    `INSERT INTO push_tokens (id, user_id, token, token_hash, platform, device_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), token = VALUES(token), platform = VALUES(platform), device_id = VALUES(device_id), updated_at = VALUES(updated_at)`,
    [createId(), req.user.id, token, hash, platform, deviceId || null, timestamp, timestamp]
  );
  const [countRows] = await pool.query("SELECT COUNT(*) AS token_count FROM push_tokens WHERE user_id = ?", [req.user.id]);
  res.json({ ok: true, tokenCount: Number(countRows[0]?.token_count || 0) });
});

app.get("/api/push-status", requireUser, async (req, res) => {
  const [tokenRows] = await pool.query(
    "SELECT platform, device_id, updated_at FROM push_tokens WHERE user_id = ? ORDER BY updated_at DESC",
    [req.user.id]
  );
  const provider = await activeProviderProfileFor(req.user.id);
  res.json({
    firebase: Boolean(firebaseMessaging),
    tokenCount: tokenRows.length,
    tokens: tokenRows.map((row) => ({
      platform: row.platform,
      deviceId: row.device_id || "",
      updatedAt: row.updated_at,
    })),
    provider: provider ? {
      status: provider.status || "",
      category: provider.category || "",
    } : null,
  });
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
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1", [username]);
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

app.delete("/api/account", requireUser, async (req, res) => {
  if (isStaffRole(req.user.role)) return res.status(403).json({ error: "Staff accounts must be removed by another administrator" });
  const confirmation = String(req.body?.confirmation || "").trim().toUpperCase();
  if (confirmation !== "DELETE") return res.status(400).json({ error: "Type DELETE to confirm account deletion" });
  const timestamp = nowMysql();
  const deletedName = `Deleted ${req.user.role}`;
  await pool.query("DELETE FROM push_tokens WHERE user_id = ?", [req.user.id]);
  await pool.query("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", [req.user.id, req.user.id]);
  await pool.query("UPDATE providers SET status = 'Deleted', updated_at = ? WHERE user_id = ?", [timestamp, req.user.id]);
  await pool.query(
    `UPDATE users
     SET name = ?, username = ?, email = NULL, password_hash = ?, area = 'Deleted account', category = NULL,
       contact_number = NULL, messenger_link = NULL, preferred_contact_channel = NULL, best_contact_time = NULL,
       data_privacy_consent = 0, photo_file = NULL, photo_mime_type = NULL, deleted_at = ?
     WHERE id = ?`,
    [deletedName, `deleted_${req.user.id.slice(0, 16)}`, passwordHash(crypto.randomBytes(24).toString("hex")), timestamp, req.user.id]
  );
  await addActivity("Account deleted", `${deletedName} removed their account`);
  broadcast("kaila.state.updated", await getState());
  res.json({ ok: true });
});

app.post("/api/reports/user", requireUser, async (req, res) => {
  const reportedUserId = String(req.body?.reportedUserId || "").trim();
  const reason = String(req.body?.reason || "").trim().slice(0, 160);
  const details = String(req.body?.details || "").trim().slice(0, 2000);
  const target = await getUser(reportedUserId);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "You cannot report your own account" });
  if (!reason) return res.status(400).json({ error: "Report reason is required" });
  const timestamp = nowMysql();
  const reportId = createId();
  await pool.query(
    "INSERT INTO moderation_reports (id, reporter_id, reported_user_id, request_id, type, reason, details, status, created_at, updated_at) VALUES (?, ?, ?, NULL, 'user', ?, ?, 'Open', ?, ?)",
    [reportId, req.user.id, target.id, reason, details, timestamp, timestamp]
  );
  await addActivity("User reported", `${displayNameForUser(req.user)} reported ${displayNameForUser(target)}: ${reason}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.moderation.reported", { reportId, type: "user" });
  res.status(201).json({ state });
});

app.post("/api/reports/job", requireUser, async (req, res) => {
  const requestId = String(req.body?.requestId || "").trim();
  const reason = String(req.body?.reason || "").trim().slice(0, 160);
  const details = String(req.body?.details || "").trim().slice(0, 2000);
  const [rows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
  if (!rows.length) return res.status(404).json({ error: "Request not found" });
  const request = rows[0];
  const involved = request.client_id === req.user.id || request.accepted_provider_id === req.user.id || ["admin", "customer_service"].includes(req.user.role);
  const provider = await activeProviderProfileFor(req.user.id);
  const matchingProvider = Boolean(provider && hasCategory(provider.category, request.category));
  if (!involved && !matchingProvider) return res.status(403).json({ error: "You cannot report this job" });
  if (!reason) return res.status(400).json({ error: "Report reason is required" });
  const timestamp = nowMysql();
  const reportId = createId();
  await pool.query(
    "INSERT INTO moderation_reports (id, reporter_id, reported_user_id, request_id, type, reason, details, status, created_at, updated_at) VALUES (?, ?, NULL, ?, 'job', ?, ?, 'Open', ?, ?)",
    [reportId, req.user.id, request.id, reason, details, timestamp, timestamp]
  );
  await addActivity("Job reported", `${displayNameForUser(req.user)} reported ${request.category}: ${reason}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.moderation.reported", { reportId, type: "job", requestId: request.id });
  res.status(201).json({ state });
});

app.post("/api/blocks/:userId", requireUser, async (req, res) => {
  const target = await getUser(req.params.userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "You cannot block your own account" });
  if (isStaffRole(target.role)) return res.status(400).json({ error: "Official KAILA support accounts cannot be blocked" });
  const reason = String(req.body?.reason || "").trim().slice(0, 1000);
  const timestamp = nowMysql();
  await pool.query(
    `INSERT INTO user_blocks (blocker_id, blocked_id, reason, created_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE reason = VALUES(reason), created_at = VALUES(created_at)`,
    [req.user.id, target.id, reason, timestamp]
  );
  await addActivity("User blocked", `${displayNameForUser(req.user)} blocked ${displayNameForUser(target)}`);
  res.json({ state: await getStateFor(req.user) });
});

app.delete("/api/blocks/:userId", requireUser, async (req, res) => {
  await pool.query("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?", [req.user.id, req.params.userId]);
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/providers", requireUser, async (req, res) => {
  if (!canUseMarketplaceRole(req.user)) return res.status(403).json({ error: "Only marketplace accounts can save provider profiles" });
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
  if (!canUseMarketplaceRole(req.user)) return res.status(403).json({ error: "Only marketplace accounts can post requests" });
  const {
    category, urgency, area, budget, preferredSchedule, contactMethod, exactLocationNotes,
    jobLocation, jobLocationSource, permissionToForward, consentToRate, details, attachments = [],
  } = req.body || {};
  if (!category || !details) return res.status(400).json({ error: "Category and details are required" });
  if (!boolField(permissionToForward) || !boolField(consentToRate)) return res.status(400).json({ error: "Permission to forward and rating consent are required" });
  const timestamp = nowMysql();
  const cleanJobLocation = locationPayload(jobLocation);
  if (cleanJobLocation.lat === null) return res.status(400).json({ error: "Pin the job site before posting" });
  if ((urgency || "Today") === "Scheduled" && !String(preferredSchedule || "").trim()) return res.status(400).json({ error: "Scheduled requests need a job date and time" });
  const request = {
    id: createId(),
    clientId: req.user.id,
    clientName: req.user.name,
    category,
    urgency: urgency || "Today",
    area: String(area || "Pinned job site").trim(),
    budget: budget || "Open",
    preferredSchedule: String(preferredSchedule || "").trim(),
    contactMethod: String(contactMethod || req.user.preferredContactChannel || "").trim(),
    exactLocationNotes: String(exactLocationNotes || "").trim(),
    jobLocation: cleanJobLocation.lat !== null ? cleanJobLocation : null,
    jobLocationSource: cleanJobLocation.lat !== null ? String(jobLocationSource || "current").trim().slice(0, 40) : "",
    permissionToForward: boolField(permissionToForward),
    consentToRate: boolField(consentToRate),
    details,
    status: "Posted",
    offers: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await pool.query(
    "INSERT INTO requests (id, client_id, client_name, category, urgency, area, budget, preferred_schedule, contact_method, exact_location_notes, job_lat, job_lng, job_location_source, permission_to_forward, consent_to_rate, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      request.id, request.clientId, request.clientName, request.category, request.urgency, request.area, request.budget,
      request.preferredSchedule, request.contactMethod, request.exactLocationNotes, request.jobLocation?.lat ?? null,
      request.jobLocation?.lng ?? null, request.jobLocationSource || null, request.permissionToForward ? 1 : 0,
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
  const providerUserIds = await providerUserIdsForRequestCategory(request.category);
  pushNotification(providerUserIds, {
    type: "request",
    title: "New KAILA job request",
    body: `${request.category} in ${request.area}${request.urgency ? ` - ${request.urgency}` : ""}`,
    ttl: 2 * 60 * 60 * 1000,
    data: {
      action: "job-request",
      requestId: request.id,
      category: request.category,
      urgency: request.urgency,
      persistent: "true",
      attention: "job-request",
    },
  }).then((result) => {
    console.log("KAILA request push", {
      requestId: request.id,
      category: request.category,
      matchedProviders: providerUserIds.length,
      sent: result?.sent || 0,
      tokenCount: result?.tokenCount || 0,
      reason: result?.reason || "",
    });
  }).catch((error) => console.warn("Request push failed:", error.message));
  res.status(201).json({ request, state: await getStateFor(req.user) });
});

app.put("/api/requests/:id", requireUser, async (req, res) => {
  if (!canUseMarketplaceRole(req.user)) return res.status(403).json({ error: "Only marketplace accounts can edit requests" });
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const existing = requestRows[0];
  if (existing.client_id !== req.user.id) return res.status(403).json({ error: "Only the request owner can edit this request" });
  if (!["Posted", "Offers Received", "Countered"].includes(existing.status)) {
    return res.status(400).json({ error: "This request can no longer be edited after a provider is selected" });
  }

  const {
    category, urgency, area, budget, preferredSchedule, contactMethod, exactLocationNotes,
    jobLocation, jobLocationSource, permissionToForward, consentToRate, details,
  } = req.body || {};
  if (!category || !details) return res.status(400).json({ error: "Category and details are required" });
  if (!boolField(permissionToForward) || !boolField(consentToRate)) return res.status(400).json({ error: "Permission to forward and rating consent are required" });
  const timestamp = nowMysql();
  const cleanJobLocation = locationPayload(jobLocation);
  if (cleanJobLocation.lat === null) return res.status(400).json({ error: "Pin the job site before saving" });
  if ((urgency || "Today") === "Scheduled" && !String(preferredSchedule || "").trim()) return res.status(400).json({ error: "Scheduled requests need a job date and time" });
  await pool.query(
    `UPDATE requests
     SET category = ?, urgency = ?, area = ?, budget = ?, preferred_schedule = ?, contact_method = ?,
         exact_location_notes = ?, job_lat = ?, job_lng = ?, job_location_source = ?, permission_to_forward = ?, consent_to_rate = ?, details = ?, updated_at = ?
     WHERE id = ?`,
    [
      category, urgency || "Today", String(area || "Pinned job site").trim(), budget || "Open", String(preferredSchedule || "").trim(),
      String(contactMethod || req.user.preferredContactChannel || "").trim(), String(exactLocationNotes || "").trim(),
      cleanJobLocation.lat, cleanJobLocation.lng, cleanJobLocation.lat !== null ? String(jobLocationSource || "current").trim().slice(0, 40) : null,
      boolField(permissionToForward) ? 1 : 0, boolField(consentToRate) ? 1 : 0, details, timestamp, req.params.id,
    ]
  );
  await addActivity("Request edited", `${category} in ${area}`);
  const [updatedRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  broadcast("kaila.request.updated", { request: mapRequest(updatedRows[0], [], [], [], new Map(), new Map()) });
  broadcast("kaila.state.updated", await getState());
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/offers", requireUser, async (req, res) => {
  if (!canUseMarketplaceRole(req.user)) return res.status(403).json({ error: "Only marketplace accounts can send offers" });
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (requestRows[0].client_id === req.user.id) return res.status(400).json({ error: "You cannot send an offer to your own request" });
  if (!["Posted", "Offers Received", "Countered"].includes(requestRows[0].status)) return res.status(400).json({ error: "This request is no longer accepting offers" });
  const provider = await activeProviderProfileFor(req.user.id);
  if (!provider || !hasCategory(provider.category, requestRows[0].category)) return res.status(403).json({ error: "This request does not match your provider categories" });
  const [passRows] = await pool.query("SELECT request_id FROM request_passes WHERE request_id = ? AND provider_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (passRows.length) return res.status(400).json({ error: "You already passed this request" });
  const { amount, schedule, notes, type, providerLocation } = req.body || {};
  if (!amount) return res.status(400).json({ error: "Amount is required" });
  if (!String(schedule || "").trim()) return res.status(400).json({ error: "Schedule is required" });
  const cleanProviderLocation = locationPayload(providerLocation);
  if (requestRows[0].job_lat !== null && cleanProviderLocation.lat === null) {
    return res.status(400).json({ error: "Provider location is required so clients can see route distance" });
  }
  const offer = {
    id: createId(),
    type: type === "counter" ? "counter" : "offer",
    providerId: req.user.id,
    providerName: req.user.name,
    amount,
    schedule: String(schedule || "").trim(),
    notes: notes || "",
    providerLocation: cleanProviderLocation.lat !== null ? { ...cleanProviderLocation, capturedAt: nowMysql() } : null,
    createdAt: nowMysql(),
  };
  const status = offer.type === "counter" ? "Countered" : "Offers Received";
  await pool.query("DELETE FROM offers WHERE request_id = ? AND provider_id = ?", [req.params.id, offer.providerId]);
  await pool.query(
    "INSERT INTO offers (id, request_id, type, provider_id, provider_name, amount, schedule, notes, provider_lat, provider_lng, provider_location_captured_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      offer.id, req.params.id, offer.type, offer.providerId, offer.providerName, offer.amount, offer.schedule, offer.notes,
      offer.providerLocation?.lat ?? null, offer.providerLocation?.lng ?? null, offer.providerLocation?.capturedAt ?? null, offer.createdAt,
    ]
  );
  await pool.query("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?", [status, nowMysql(), req.params.id]);
  await addActivity(offer.type === "counter" ? "Counter-offer sent" : "Offer sent", `${offer.amount} for ${requestRows[0].category}`);
  broadcast("kaila.offer.saved", { requestId: req.params.id, offer, status });
  pushNotification([requestRows[0].client_id], {
    type: "offer",
    title: offer.type === "counter" ? "New counter-offer" : "New provider offer",
    body: `${displayNameForUser(req.user)} sent ${offer.amount} for ${requestRows[0].category}`,
    data: { action: "offer", requestId: req.params.id, offerId: offer.id, senderName: displayNameForUser(req.user), createdAt: offer.createdAt },
  }).catch((error) => console.warn("Offer push failed:", error.message));
  res.status(201).json({ offer, state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/pass", requireUser, async (req, res) => {
  if (!canUseMarketplaceRole(req.user)) return res.status(403).json({ error: "Only marketplace accounts can pass requests" });
  const [requestRows] = await pool.query("SELECT status, client_id, category FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (requestRows[0].client_id === req.user.id) return res.status(400).json({ error: "You cannot pass your own request" });
  const provider = await activeProviderProfileFor(req.user.id);
  if (!provider) return res.status(403).json({ error: "Create a provider profile before passing requests" });
  if (!hasCategory(provider.category, requestRows[0].category)) return res.status(403).json({ error: "This request does not match your provider categories" });
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
  clearJobRequestNotification([req.user.id], req.params.id).catch((error) => console.warn("Pass clear push failed:", error.message));
  res.json({ state: await getStateFor(req.user) });
});

app.post("/api/requests/:id/confirm", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (request.client_id !== req.user.id) return res.status(403).json({ error: "Only the client can confirm this job" });
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
  clearJobRequestNotification(await requestAlertUserIds(request), req.params.id).catch((error) => console.warn("Confirm clear push failed:", error.message));
  pushNotification([offerRows[0].provider_id], {
    type: "job",
    title: "Offer accepted",
    body: `${request.category} is confirmed. Messaging is open.`,
    data: { action: "job", requestId: req.params.id, senderName: displayNameForUser(req.user), createdAt: timestamp },
  }).catch((error) => console.warn("Confirm push failed:", error.message));
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
  const isClient = request.client_id === req.user.id;
  const isProviderForJob = request.accepted_provider_id === req.user.id;
  const isSupport = req.user.role === "customer_service";

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
  } else if (["support_resume_job", "support_request_revision", "support_release_payment", "resolve_dispute", "support_cancel_request"].includes(action)) {
    if (!isSupport) return res.status(403).json({ error: "Only Customer Service can resolve disputed jobs" });
    if (request.status !== "Disputed") return res.status(400).json({ error: "Only disputed jobs can receive a support outcome" });
    if (!note) return res.status(400).json({ error: "Resolution note is required" });
    if (action === "support_resume_job") {
      nextStatus = "In Progress";
      extraSql = ", dispute_note = ?, provider_done_at = NULL, auto_confirm_at = NULL, payment_released_at = NULL, rating_deadline_at = NULL";
      extraParams = [supportDisputeNote(request, "Job resumed", note)];
      activityTitle = "Dispute resolved: job resumed";
      activityDetail = `${request.category} returned to in-progress work`;
    } else if (action === "support_request_revision") {
      nextStatus = "Revision Requested";
      extraSql = ", revision_note = ?, dispute_note = ?, auto_confirm_at = NULL, payment_released_at = NULL, rating_deadline_at = NULL";
      extraParams = [note, supportDisputeNote(request, "Revision requested", note)];
      activityTitle = "Dispute resolved: revision requested";
      activityDetail = `${request.category} needs provider revision`;
    } else if (action === "support_release_payment") {
      nextStatus = "Payment Released";
      extraSql = ", confirmed_at = ?, payment_released_at = ?, rating_deadline_at = ?, dispute_note = ?, auto_confirm_at = NULL";
      extraParams = [timestamp, timestamp, futureMysqlDays(RATING_WINDOW_DAYS), supportDisputeNote(request, "Payment released", note)];
      activityTitle = "Dispute resolved: payment released";
      activityDetail = `${request.category} was completed by support decision`;
    } else if (action === "support_cancel_request") {
      nextStatus = "Cancelled";
      extraSql = ", dispute_note = ?, auto_confirm_at = NULL, payment_released_at = NULL, rating_deadline_at = NULL";
      extraParams = [supportDisputeNote(request, "Request cancelled", note)];
      activityTitle = "Dispute resolved: request cancelled";
      activityDetail = `${request.category} was cancelled by support decision`;
    } else {
      nextStatus = "Resolved";
      extraSql = ", dispute_note = ?, auto_confirm_at = NULL";
      extraParams = [supportDisputeNote(request, "Closed", note)];
      activityTitle = "Dispute resolved";
      activityDetail = `${request.category} was closed by Customer Service`;
    }
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
  if (["Cancelled", "Accepted", "In Progress", "Provider Marked Done", "Payment Released", "Rated / Closed", "Resolved"].includes(nextStatus)) {
    clearJobRequestNotification(await requestAlertUserIds(request), req.params.id).catch((error) => console.warn("Action clear push failed:", error.message));
  }
  res.json({ state: await getStateFor(req.user) });
});

app.get("/api/requests/:id/messages", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  if (!canReadConversation(request, req.user)) return res.status(403).json({ error: "Conversation is only available to the confirmed job parties" });
  const [messageRows] = await pool.query(
    "SELECT message.*, sender.role AS sender_role FROM job_messages AS message JOIN users AS sender ON sender.id = message.sender_id WHERE message.request_id = ? ORDER BY message.created_at ASC",
    [req.params.id]
  );
  const messageIds = messageRows.map((row) => row.id);
  const [attachmentRows] = messageIds.length
    ? await pool.query(`SELECT * FROM job_message_attachments WHERE message_id IN (${messageIds.map(() => "?").join(",")}) ORDER BY created_at ASC`, messageIds)
    : [[]];
  const attachmentsByMessage = new Map();
  for (const row of attachmentRows) {
    if (!attachmentsByMessage.has(row.message_id)) attachmentsByMessage.set(row.message_id, []);
    attachmentsByMessage.get(row.message_id).push(mapJobMessageAttachment(row));
  }
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
    messages: messageRows.map((row) => ({ ...mapMessage(row, reactionsByMessage.get(row.id) || []), attachments: attachmentsByMessage.get(row.id) || [] })),
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
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
  if (!detail && !attachments.length) return res.status(400).json({ error: "Message or media is required" });
  if (detail.length > 2000) return res.status(400).json({ error: "Message must be 2000 characters or fewer" });
  const message = {
    id: createId(),
    requestId: req.params.id,
    senderId: req.user.id,
    senderName: displayNameForUser(req.user),
    detail,
    attachments: [],
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO job_messages (id, request_id, sender_id, sender_name, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [message.id, message.requestId, message.senderId, message.senderName, encryptMessage(message.detail || "Media attachment", message.id), message.createdAt]
  );
  try {
    await saveJobMessageAttachments(message.id, attachments);
  } catch (error) {
    await pool.query("DELETE FROM job_messages WHERE id = ?", [message.id]);
    return res.status(400).json({ error: error.message });
  }
  if (attachments.length) {
    const [attachmentRows] = await pool.query("SELECT * FROM job_message_attachments WHERE message_id = ? ORDER BY created_at ASC", [message.id]);
    message.attachments = attachmentRows.map(mapJobMessageAttachment);
  }
  broadcast("kaila.message.saved", { requestId: req.params.id, message });
  const recipientId = otherConversationUserId(request, req.user.id);
  pushNotification([recipientId], {
    type: "message",
    title: "New KAILA message",
    body: `${message.senderName}: ${message.detail || "Sent media"}`,
    data: { action: "message", requestId: req.params.id, messageId: message.id, senderId: req.user.id, senderName: message.senderName, createdAt: message.createdAt },
  }).catch((error) => console.warn("Message push failed:", error.message));
  res.status(201).json({ message });
});

app.post("/api/requests/:id/typing", requireUser, async (req, res) => {
  const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [req.params.id]);
  if (!requestRows.length) return res.status(404).json({ error: "Request not found" });
  if (!canWriteConversation(requestRows[0], req.user)) return res.status(403).json({ error: "This conversation is archived" });
  broadcast("kaila.typing.changed", {
    requestId: req.params.id,
    senderId: req.user.id,
    senderName: displayNameForUser(req.user),
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

app.get("/api/direct-conversations/:userId/messages", requireUser, async (req, res) => {
  const target = await getUser(req.params.userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  const requestId = String(req.query?.requestId || "").trim();
  let requestContext = null;
  try {
    requestContext = await loadDirectRequestContext(requestId, req.user, target);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }
  if (!await canOpenDirectConversation(req.user, target, requestId)) return res.status(403).json({ error: "Direct chat is not available for these accounts" });
  const [messageRows] = await pool.query(
    "SELECT message.*, sender.role AS sender_role FROM direct_messages AS message JOIN users AS sender ON sender.id = message.sender_id WHERE ((message.sender_id = ? AND message.recipient_id = ?) OR (message.sender_id = ? AND message.recipient_id = ?)) AND (message.request_id <=> ?) ORDER BY message.created_at ASC",
    [req.user.id, target.id, target.id, req.user.id, requestId || null]
  );
  const messageIds = messageRows.map((row) => row.id);
  const [attachmentRows] = messageIds.length
    ? await pool.query(`SELECT * FROM direct_message_attachments WHERE message_id IN (${messageIds.map(() => "?").join(",")}) ORDER BY created_at ASC`, messageIds)
    : [[]];
  const attachmentsByMessage = new Map();
  for (const row of attachmentRows) {
    if (!attachmentsByMessage.has(row.message_id)) attachmentsByMessage.set(row.message_id, []);
    attachmentsByMessage.get(row.message_id).push(mapDirectAttachment(row));
  }
  res.json({
    target: publicUser(target),
    messages: messageRows.map((row) => ({ ...mapDirectMessage(row), attachments: attachmentsByMessage.get(row.id) || [] })),
    writable: await canWriteDirectConversation(req.user, target, requestId),
    callable: canInitiateDirectCall(req.user, target),
    requestContext,
    activeUserIds: activeDirectConversationUserIds(req.user.id, target.id),
  });
});

app.post("/api/direct-conversations/:userId/messages", requireUser, async (req, res) => {
  const target = await getUser(req.params.userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  const requestId = String(req.query?.requestId || "").trim();
  try {
    await loadDirectRequestContext(requestId, req.user, target);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }
  if (!await canWriteDirectConversation(req.user, target, requestId)) return res.status(403).json({ error: "Direct chat is not available for these accounts" });
  const detail = String(req.body?.detail || "").trim();
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
  if (!detail && !attachments.length) return res.status(400).json({ error: "Message or media is required" });
  if (detail.length > 2000) return res.status(400).json({ error: "Message must be 2000 characters or fewer" });
  const message = {
    id: createId(),
    senderId: req.user.id,
    recipientId: target.id,
    requestId,
    senderName: displayNameForUser(req.user),
    detail,
    attachments: [],
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO direct_messages (id, sender_id, recipient_id, request_id, sender_name, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [message.id, message.senderId, message.recipientId, message.requestId || null, message.senderName, encryptMessage(message.detail || "Media attachment", message.id), message.createdAt]
  );
  try {
    await saveDirectAttachments(message.id, attachments);
  } catch (error) {
    await pool.query("DELETE FROM direct_messages WHERE id = ?", [message.id]);
    return res.status(400).json({ error: error.message });
  }
  if (attachments.length) {
    const [attachmentRows] = await pool.query("SELECT * FROM direct_message_attachments WHERE message_id = ? ORDER BY created_at ASC", [message.id]);
    message.attachments = attachmentRows.map(mapDirectAttachment);
  }
  relayDirectEvent([req.user.id, target.id], "kaila.direct-message.saved", { userIds: [req.user.id, target.id], message });
  pushNotification([target.id], {
    type: "direct-message",
    title: "New direct message",
    body: `${message.senderName}: ${message.detail || "Sent media"}`,
    data: { action: "direct-message", userId: req.user.id, senderId: req.user.id, requestId, messageId: message.id, senderName: message.senderName, createdAt: message.createdAt },
  }).catch((error) => console.warn("Direct message push failed:", error.message));
  res.status(201).json({ message });
});

app.post("/api/direct-conversations/:userId/presence", requireUser, async (req, res) => {
  const target = await getUser(req.params.userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (!await canOpenDirectConversation(req.user, target)) return res.status(403).json({ error: "Direct chat is not available for these accounts" });
  const key = directConversationKey(req.user.id, target.id);
  const room = directConversationPresence.get(key) || new Map();
  if (req.body?.active) room.set(req.user.id, Date.now());
  else room.delete(req.user.id);
  if (room.size) directConversationPresence.set(key, room);
  else directConversationPresence.delete(key);
  relayDirectEvent([req.user.id, target.id], "kaila.direct-presence.changed", { userIds: [req.user.id, target.id] });
  res.json({ activeUserIds: activeDirectConversationUserIds(req.user.id, target.id) });
});

app.post("/api/activity", requireUser, async (req, res) => {
  if (req.user.role === "ops") return res.status(403).json({ error: "Ops accounts are limited to validation work" });
  const detail = String(req.body?.detail || "").trim();
  if (!detail) return res.status(400).json({ error: "Message is required" });
  const activity = await addActivity("Team note", `${displayNameForUser(req.user)}: ${detail}`);
  res.status(201).json({ activity, state: await getStateFor(req.user) });
});

app.post("/api/validation/decision-signal", requireUser, async (req, res) => {
  if (!["admin", "ops"].includes(req.user.role)) return res.status(403).json({ error: "Admin or ops only" });
  const type = String(req.body?.type || "").trim();
  if (!["client_survey", "provider_interview"].includes(type)) return res.status(400).json({ error: "Invalid validation form type" });
  const responses = req.body?.responses && typeof req.body.responses === "object" ? req.body.responses : {};
  if (JSON.stringify(responses).length > 12000) return res.status(400).json({ error: "Validation entry is too long" });
  const suggestion = await groqChatJson(validationDecisionPrompt(type, responses), () => ({
    decisionSignal: localDecisionSignal(type, responses),
    reason: "Suggested from local scoring because Groq was unavailable.",
  }));
  res.json({
    decisionSignal: normalizeDecisionSignal(suggestion.decisionSignal),
    reason: String(suggestion.reason || "").trim().slice(0, 240),
  });
});

app.post("/api/analytics/insights", requireUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const state = await getStateFor(req.user);
  const requests = state.requests || [];
  const providers = state.providers || [];
  const entries = state.validationEntries || [];
  const completedStatuses = new Set(["Payment Released", "Rated / Closed", "Resolved"]);
  const completedRequests = requests.filter((request) => completedStatuses.has(request.status));
  const respondedRequests = requests.filter((request) => (request.offers || []).length || (request.passedProviderIds || []).length).length;
  const ratingScores = requests.flatMap((request) => [request.clientRatingScore, request.providerRatingScore])
    .map(Number)
    .filter((score) => Number.isFinite(score) && score > 0);
  const metrics = {
    activeProviders: providers.filter((provider) => (provider.status || "Active") === "Active").length,
    requests: requests.length,
    responseRate: requests.length ? Math.round((respondedRequests / requests.length) * 100) : 0,
    offersPerRequest: requests.length ? Math.round((requests.reduce((total, request) => total + (request.offers || []).length, 0) / requests.length) * 10) / 10 : 0,
    completedJobs: completedRequests.length,
    averageRating: ratingScores.length ? Math.round((ratingScores.reduce((sum, score) => sum + score, 0) / ratingScores.length) * 10) / 10 : 0,
    disputes: requests.filter((request) => request.status === "Disputed" || request.disputeNote).length,
    validationEntries: entries.length,
    positiveSignals: entries.filter((entry) => ["Strong positive", "Positive"].includes(entry.decisionSignal)).length,
    blockers: entries.filter((entry) => entry.decisionSignal === "Blocker").length,
  };
  const samples = {
    recentRequests: requests.slice(0, 8).map((request) => ({
      category: request.category,
      status: request.status,
      area: request.area,
      offerCount: (request.offers || []).length,
      budget: request.budget,
    })),
    topProviderCategories: providers.slice(0, 12).map((provider) => ({
      category: provider.category,
      area: provider.area,
      rating: provider.reputation?.average || 0,
    })),
    recentValidation: entries.slice(0, 8).map((entry) => ({
      type: entry.type,
      category: entry.category,
      signal: entry.decisionSignal,
      notes: entry.notes,
    })),
  };
  const insight = await groqChatJson(analyticsPrompt(metrics, samples), () => ({
    summary: `${metrics.requests} requests, ${metrics.activeProviders} active providers, and ${metrics.responseRate}% response rate are currently tracked.`,
    risks: metrics.disputes ? ["Review disputed jobs before scaling volume."] : ["Watch categories with requests but few provider replies."],
    actions: ["Prioritize provider follow-up for low-response categories.", "Use validation entries to decide the next category push."],
  }));
  res.json({
    summary: String(insight.summary || "").trim().slice(0, 280),
    risks: Array.isArray(insight.risks) ? insight.risks.map((item) => String(item).trim()).filter(Boolean).slice(0, 3) : [],
    actions: Array.isArray(insight.actions) ? insight.actions.map((item) => String(item).trim()).filter(Boolean).slice(0, 3) : [],
  });
});

app.post("/api/validation", requireUser, async (req, res) => {
  if (!["admin", "ops"].includes(req.user.role)) return res.status(403).json({ error: "Admin or ops only" });
  let payload;
  try {
    payload = validationPayload(req.body);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  const entry = {
    id: createId(),
    ...payload,
    operatorId: req.user.id,
    operatorName: displayNameForUser(req.user),
    createdAt: nowMysql(),
  };
  await pool.query(
    "INSERT INTO validation_entries (id, type, operator_id, operator_name, subject_name, area, category, decision_signal, responses, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [entry.id, entry.type, entry.operatorId, entry.operatorName, entry.subjectName, entry.area, entry.category, entry.decisionSignal, JSON.stringify(entry.responses), entry.notes, entry.createdAt]
  );
  await addActivity(payload.type === "client_survey" ? "Client survey recorded" : "Provider interview recorded", `${displayNameForUser(req.user)}: ${entry.subjectName} - ${entry.decisionSignal || "No decision signal"}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", await getState());
  broadcast("kaila.validation.updated", { entryId: entry.id, action: "created" });
  res.status(201).json({ entry, state });
});

app.put("/api/validation/:id", requireUser, async (req, res) => {
  if (!["admin", "ops"].includes(req.user.role)) return res.status(403).json({ error: "Admin or ops only" });
  const [rows] = await pool.query("SELECT * FROM validation_entries WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Validation entry not found" });
  if (rows[0].operator_id !== req.user.id) return res.status(403).json({ error: "Only the user who conducted this entry can edit it" });
  let payload;
  try {
    payload = validationPayload(req.body);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }
  await pool.query(
    "UPDATE validation_entries SET type = ?, subject_name = ?, area = ?, category = ?, decision_signal = ?, responses = ?, notes = ? WHERE id = ?",
    [payload.type, payload.subjectName, payload.area, payload.category, payload.decisionSignal, JSON.stringify(payload.responses), payload.notes, req.params.id]
  );
  await addActivity(payload.type === "client_survey" ? "Client survey edited" : "Provider interview edited", `${displayNameForUser(req.user)}: ${payload.subjectName} - ${payload.decisionSignal || "No decision signal"}`);
  const [updatedRows] = await pool.query("SELECT * FROM validation_entries WHERE id = ? LIMIT 1", [req.params.id]);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", await getState());
  broadcast("kaila.validation.updated", { entryId: req.params.id, action: "updated" });
  res.json({ entry: mapValidationEntry(updatedRows[0]), state });
});

app.delete("/api/validation/:id", requireUser, async (req, res) => {
  if (!["admin", "ops"].includes(req.user.role)) return res.status(403).json({ error: "Admin or ops only" });
  const [rows] = await pool.query("SELECT * FROM validation_entries WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Validation entry not found" });
  if (rows[0].operator_id !== req.user.id) return res.status(403).json({ error: "Only the user who conducted this entry can delete it" });
  const entry = mapValidationEntry(rows[0]);
  await pool.query("DELETE FROM validation_entries WHERE id = ?", [req.params.id]);
  await addActivity(entry.type === "client_survey" ? "Client survey deleted" : "Provider interview deleted", `${displayNameForUser(req.user)}: ${entry.subjectName || "Validation entry"}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", await getState());
  broadcast("kaila.validation.updated", { entryId: req.params.id, action: "deleted" });
  res.json({ state });
});

app.post("/api/admin/users", requireUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  let user;
  try {
    user = await createAccount(req.body, ["client", "provider", "ops", "customer_service"]);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || "Account creation failed" });
  }
  await addActivity("Account created", `${displayNameForUser(req.user)} created ${displayNameForUser(user)} as ${user.role}`);
  const state = await getStateFor(req.user);
  broadcast("kaila.state.updated", state);
  res.status(201).json({ user: publicUser(user), state });
});

app.post("/api/admin/truncate", requireUser, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  await pool.query("TRUNCATE TABLE activities");
  await pool.query("TRUNCATE TABLE job_message_reactions");
  await pool.query("TRUNCATE TABLE missed_calls");
  await pool.query("TRUNCATE TABLE direct_message_attachments");
  await pool.query("TRUNCATE TABLE direct_messages");
  await pool.query("TRUNCATE TABLE job_message_attachments");
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

function registerSocketHandlers(socketServer) {
socketServer.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    if (!channel) return;
    socket.join(channel);
    socket.emit("kaila.socket.ready", { channel, socketId: socket.id });
  });

  socket.on("identify", async (userId, acknowledge = () => {}) => {
    try {
      const user = await getUser(userId);
      if (socket.data.userId) socket.leave(`user:${socket.data.userId}`);
      socket.data.userId = user?.id || "";
      if (!user) {
        acknowledge({ ok: false, error: "User not found" });
        return;
      }
      socket.join(`user:${user.id}`);
      socket.emit("kaila.socket.identified", { userId: user.id });
      acknowledge({ ok: true, userId: user.id });
      for (const [callId, call] of activeCalls) {
        if (call.targetUserId !== user.id || call.answeredByUserId) continue;
        const caller = await getUser(call.callerId);
        socket.emit("kaila.call.signal", {
          requestId: call.requestId || "",
          directUserId: call.directUserIds?.find((id) => id !== user.id) || call.callerId || "",
          callId,
          type: "offer",
          senderId: call.callerId,
          senderName: call.callerName || displayNameForUser(caller || {}),
          description: call.offerDescription,
          candidate: null,
          withVideo: Boolean(call.withVideo),
        });
      }
    } catch (error) {
      console.error("Socket identity failed:", error);
      acknowledge({ ok: false, error: error.message || "Socket identity failed" });
    }
  });

  socket.on("kaila.call.check", async (payload = {}, acknowledge = () => {}) => {
    try {
      const user = await getUser(socket.data.userId);
      if (!user) throw new Error("Sign in before starting a call");
      const directUserId = String(payload.directUserId || "");
      if (directUserId) {
        const target = await getUser(directUserId);
        if (!target || !canInitiateDirectCall(user, target)) {
          throw new Error("Only Customer Service staff can call clients or providers");
        }
        if (await isBlockedBetween(user.id, target.id)) throw new Error("Calls are blocked between these accounts");
        const online = Boolean(await userSocketCount(target.id));
        return acknowledge({ ok: online });
      }
      const requestId = String(payload.requestId || "");
      const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
      if (!requestRows.length || !canWriteConversation(requestRows[0], user)) {
        throw new Error("Audio calls are only available while the confirmed job conversation is active");
      }
      const targetUserId = otherConversationUserId(requestRows[0], user.id);
      const online = Boolean(targetUserId && await userSocketCount(targetUserId));
      acknowledge({ ok: online });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "Could not check call availability" });
    }
  });

  socket.on("kaila.call.signal", async (payload = {}, acknowledge = () => {}) => {
    try {
      const user = await getUser(socket.data.userId);
      if (!user) throw new Error("Sign in before starting a call");
      const requestId = String(payload.requestId || "");
      const directUserId = String(payload.directUserId || "");
      const callId = String(payload.callId || "");
      const type = String(payload.type || "");
      if ((!requestId && !directUserId) || !callId || !["offer", "answer", "candidate", "renegotiate", "video-stalled", "hangup", "reject", "busy"].includes(type)) {
        throw new Error("Invalid call signal");
      }
      let targetUserId = "";
      let contextTitle = "";
      if (directUserId) {
        const activeCall = activeCalls.get(callId);
        if (type === "offer") {
          const target = await getUser(directUserId);
          if (!target) throw new Error("Call recipient not found");
          if (!canInitiateDirectCall(user, target)) {
            throw new Error("Only Customer Service staff can call clients or providers");
          }
          if (await isBlockedBetween(user.id, target.id)) throw new Error("Calls are blocked between these accounts");
          contextTitle = target.name;
          targetUserId = target.id;
        } else {
          if (!activeCall?.userIds.includes(user.id)) {
            const staleTypes = new Set(["candidate", "video-stalled", "hangup", "reject", "busy"]);
            if (staleTypes.has(type)) return acknowledge({ ok: true, code: "call_expired" });
            return acknowledge({ ok: false, code: "call_expired", error: "This call already ended. Ask the caller to try again." });
          }
          targetUserId = activeCall.userIds.find((item) => item !== user.id) || "";
          const target = await getUser(targetUserId);
          contextTitle = activeCall.contextTitle || target?.name || "";
        }
      } else {
        const [requestRows] = await pool.query("SELECT * FROM requests WHERE id = ? LIMIT 1", [requestId]);
        if (!requestRows.length || !canWriteConversation(requestRows[0], user)) {
          throw new Error("Audio calls are only available while the confirmed job conversation is active");
        }
        contextTitle = requestRows[0].category;
        targetUserId = otherConversationUserId(requestRows[0], user.id);
      }
      if (!targetUserId) throw new Error("Call recipient not found");
      if (type === "offer") {
        const callerName = displayNameForUser(user);
        activeCalls.set(callId, {
          requestId,
          directUserIds: directUserId ? [user.id, targetUserId] : [],
          callerId: user.id,
          targetUserId,
          callType: payload.withVideo ? "video" : "audio",
          contextTitle,
          offerDescription: payload.description || null,
          withVideo: Boolean(payload.withVideo),
          callerName,
          userIds: [user.id, targetUserId],
          startedAtMs: Date.now(),
          startedAt: nowMysql(),
          answeredAt: 0,
          answeredAtMysql: "",
          answeredBySocketId: "",
          answeredByUserId: "",
          declinedSocketIds: new Set(),
          busySocketIds: new Set(),
        });
        scheduleCallRingExpiry(callId);
        pushNotification([targetUserId], {
          type: "call",
          title: `Incoming KAILA ${payload.withVideo ? "video call" : "audio call"}`,
          body: `${callerName} is calling.`,
          ttl: CALL_RING_TIMEOUT_MS,
          data: {
            action: "call",
            callId,
            callType: payload.withVideo ? "video" : "audio",
            callerId: user.id,
            callerName,
            requestId,
            directUserId: directUserId ? user.id : "",
            createdAt: nowMysql(),
          },
        }).catch((error) => console.warn("Incoming-call push failed:", error.message));
      }
      const activeCall = activeCalls.get(callId);
      if (type === "hangup" && activeCall && !activeCall.answeredByUserId && payload.reason === "timeout") {
        const caller = user.id === activeCall.callerId ? user : await getUser(activeCall.callerId);
        await recordMissedCallForBoth({
          caller,
          targetUserId: activeCall.targetUserId || targetUserId,
          requestId: activeCall.requestId || requestId,
          directUserId: activeCall.directUserIds?.find((item) => item !== activeCall.callerId) || directUserId || "",
          callType: activeCall.callType || "audio",
          contextTitle: activeCall.contextTitle || "",
        });
      }
      if (type === "hangup" && activeCall?.answeredByUserId) {
        await recordEndedCall(activeCall);
      }
      if (type === "answer") {
        if (activeCall?.answeredByUserId === user.id && activeCall.answeredBySocketId && activeCall.answeredBySocketId !== socket.id) {
          return acknowledge({ ok: false, code: "answered_elsewhere", error: "This call was answered on another device" });
        }
        if (activeCall && !activeCall.answeredBySocketId) {
          activeCall.answeredBySocketId = socket.id;
          activeCall.answeredByUserId = user.id;
          activeCall.answeredAt = Date.now();
          activeCall.answeredAtMysql = nowMysql();
          socket.to(`user:${user.id}`).emit("kaila.call.signal", {
            requestId,
            callId,
            type: "answered-elsewhere",
            senderId: user.id,
            senderName: displayNameForUser(user),
          });
        }
      }
      if (type === "reject" && activeCall?.answeredBySocketId && activeCall.answeredBySocketId !== socket.id) {
        return acknowledge({ ok: true });
      }
      if (type === "reject" && activeCall && !activeCall.answeredBySocketId) {
        activeCall.declinedSocketIds.add(socket.id);
        const userSocketGroups = await Promise.all(socketServers.map((serverItem) => serverItem.in(`user:${user.id}`).fetchSockets()));
        const userSockets = userSocketGroups.flat();
        if (userSockets.some((item) => !activeCall.declinedSocketIds.has(item.id))) return acknowledge({ ok: true });
        const caller = user.id === activeCall.callerId ? user : await getUser(activeCall.callerId);
        await recordMissedCallForBoth({
          caller,
          targetUserId: activeCall.targetUserId || targetUserId,
          requestId: activeCall.requestId || requestId,
          directUserId: activeCall.directUserIds?.find((item) => item !== activeCall.callerId) || directUserId || "",
          callType: activeCall.callType || "audio",
          contextTitle: activeCall.contextTitle || "",
        });
      }
      if (type === "busy" && activeCall?.answeredBySocketId) {
        return acknowledge({ ok: true });
      }
      if (type === "busy" && activeCall && !activeCall.answeredBySocketId) {
        activeCall.busySocketIds.add(socket.id);
        const userSocketGroups = await Promise.all(socketServers.map((serverItem) => serverItem.in(`user:${user.id}`).fetchSockets()));
        const userSockets = userSocketGroups.flat();
        if (userSockets.some((item) => !activeCall.busySocketIds.has(item.id))) return acknowledge({ ok: true });
      }
      if (["hangup", "reject", "busy"].includes(type)) activeCalls.delete(callId);
      relayCallSignal(targetUserId, {
        requestId,
        directUserId: directUserId ? user.id : "",
        callId,
        type,
        senderId: user.id,
        senderName: displayNameForUser(user),
        description: payload.description || null,
        candidate: payload.candidate || null,
        withVideo: Boolean(payload.withVideo),
        reason: payload.reason || "",
      });
      acknowledge({ ok: true });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "Call signal failed" });
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    scheduleDisconnectedUserCallCleanup(userId);
  });
});
}

socketServers.forEach(registerSocketHandlers);

initializePushMessaging();

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
