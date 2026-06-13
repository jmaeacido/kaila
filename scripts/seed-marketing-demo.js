const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

require("../socket/node_modules/dotenv").config({ path: path.join(__dirname, "../socket/.env") });
const mysql = require("../socket/node_modules/mysql2/promise");

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kaila_mvp",
  multipleStatements: false,
};

function now(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function passwordHash(password, salt = "kaila-demo-salt-2026") {
  const hash = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

function avatarSvg(name, bg, fg = "#ffffff") {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="68" fill="${bg}"/><circle cx="244" cy="76" r="46" fill="rgba(255,255,255,.18)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="104" font-weight="700" fill="${fg}">${initials}</text></svg>`;
}

function mediaSvg(title, subtitle, bg = "#eef7f5") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650"><rect width="900" height="650" rx="34" fill="${bg}"/><rect x="70" y="80" width="760" height="410" rx="26" fill="#ffffff"/><rect x="120" y="130" width="660" height="250" rx="20" fill="#dcefeb"/><circle cx="234" cy="226" r="54" fill="#2f7d78"/><path d="M140 388l155-120 118 83 92-70 255 107v52H140z" fill="#86b8af"/><text x="90" y="552" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#12343b">${title}</text><text x="90" y="598" font-family="Arial, sans-serif" font-size="27" fill="#47686c">${subtitle}</text></svg>`;
}

async function insertUser(db, user) {
  await db.query(
    `INSERT INTO users
      (id, name, username, email, password_hash, role, area, category, contact_number, messenger_link,
       preferred_contact_channel, best_contact_time, data_privacy_consent, photo_file, photo_mime_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'image/svg+xml', ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), email = VALUES(email), role = VALUES(role), area = VALUES(area), category = VALUES(category),
       contact_number = VALUES(contact_number), messenger_link = VALUES(messenger_link),
       preferred_contact_channel = VALUES(preferred_contact_channel), best_contact_time = VALUES(best_contact_time),
       data_privacy_consent = 1, photo_file = VALUES(photo_file), photo_mime_type = VALUES(photo_mime_type), deleted_at = NULL`,
    [
      user.id,
      user.name,
      user.username,
      user.email,
      passwordHash(user.password || "KailaDemo123!"),
      user.role,
      user.area,
      user.category || null,
      user.phone,
      user.messenger || "",
      user.channel || "SMS",
      user.bestTime || "Business hours",
      user.photoFile,
      user.createdAt || now(-10080),
    ]
  );
}

async function insertProvider(db, provider) {
  await db.query(
    `INSERT INTO providers
      (id, user_id, name, category, area, availability, skills, display_name, provider_type, specific_services,
       years_experience, coverage_area, emergency_availability, available_days, available_time, travel_limits,
       minimum_fee, price_range, work_samples, certificate_proof, valid_id_consent, consent_requests,
       consent_ratings, rules_agreement, trust_level, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'Available', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, 'Active', ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), category = VALUES(category), area = VALUES(area), availability = 'Available',
       skills = VALUES(skills), display_name = VALUES(display_name), provider_type = VALUES(provider_type),
       specific_services = VALUES(specific_services), years_experience = VALUES(years_experience),
       coverage_area = VALUES(coverage_area), emergency_availability = VALUES(emergency_availability),
       available_days = VALUES(available_days), available_time = VALUES(available_time), travel_limits = VALUES(travel_limits),
       minimum_fee = VALUES(minimum_fee), price_range = VALUES(price_range), trust_level = VALUES(trust_level),
       status = 'Active', updated_at = VALUES(updated_at)`,
    [
      provider.id,
      provider.userId,
      provider.name,
      provider.category,
      provider.area,
      provider.services,
      provider.displayName,
      provider.providerType,
      provider.services,
      provider.years,
      provider.coverage,
      provider.emergency,
      provider.days,
      provider.time,
      provider.travel,
      provider.minimumFee,
      provider.priceRange,
      provider.samples || "Portfolio available on request",
      provider.certificate || "Barangay clearance and trade references on file",
      provider.trustLevel || "Verified",
      provider.createdAt || now(-10000),
      now(-30),
    ]
  );
}

async function main() {
  const db = await mysql.createConnection(DB_CONFIG);

  const activityTables = [
    "conversation_access_audit",
    "notification_read_states",
    "message_read_states",
    "job_message_reactions",
    "feed_notifications",
    "feed_comment_reactions",
    "feed_post_comments",
    "feed_post_reactions",
    "feed_post_media",
    "feed_posts",
    "missed_calls",
    "direct_message_attachments",
    "direct_messages",
    "job_message_attachments",
    "job_messages",
    "job_navigation_states",
    "request_attachments",
    "request_passes",
    "offers",
    "moderation_reports",
    "user_blocks",
    "requests",
    "validation_entries",
    "activities",
  ];

  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of activityTables) await db.query(`TRUNCATE TABLE \`${table}\``);
  await db.query("SET FOREIGN_KEY_CHECKS = 1");

  const profileDir = path.join(__dirname, "../profile-photos");
  const uploadDir = path.join(__dirname, "../socket/uploads");
  fs.mkdirSync(profileDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });

  const users = [
    { id: "demo-client-maria", role: "client", name: "Maria Santos", username: "maria.santos.demo", email: "maria.santos@example.com", area: "Barangay 22, Gingoog City", phone: "+63 917 555 0142", channel: "SMS", bestTime: "Morning", photoFile: "demo-client-maria.svg", color: "#2f7d78" },
    { id: "demo-client-jun", role: "client", name: "Jun Velasco", username: "jun.velasco.demo", email: "jun.velasco@example.com", area: "Barangay San Luis, Gingoog City", phone: "+63 918 555 0198", channel: "Call", bestTime: "After hours", photoFile: "demo-client-jun.svg", color: "#455a64" },
    { id: "demo-client-anne", role: "client", name: "Anne Cabahug", username: "anne.cabahug.demo", email: "anne.cabahug@example.com", area: "Barangay Daan-Lungsod, Gingoog City", phone: "+63 915 555 0177", channel: "Messenger", messenger: "https://m.me/anne.cabahug.demo", bestTime: "Afternoon", photoFile: "demo-client-anne.svg", color: "#7752a1" },
    { id: "demo-provider-marco", role: "provider", name: "Marco Padilla", username: "marco.padilla.demo", email: "marco.padilla@example.com", area: "Barangay 18-A, Gingoog City", category: "Plumbing, Electrical", phone: "+63 919 555 0104", channel: "Call", bestTime: "Any time", photoFile: "demo-provider-marco.svg", color: "#0f766e" },
    { id: "demo-provider-liza", role: "provider", name: "Liza Orbeta", username: "liza.orbeta.demo", email: "liza.orbeta@example.com", area: "Barangay Lunao, Gingoog City", category: "Cleaning, Laundry", phone: "+63 916 555 0155", channel: "SMS", bestTime: "Business hours", photoFile: "demo-provider-liza.svg", color: "#b45309" },
    { id: "demo-provider-ronald", role: "provider", name: "Ronald Yap", username: "ronald.yap.demo", email: "ronald.yap@example.com", area: "Barangay Santiago, Gingoog City", category: "Appliance Repair, Aircon Services", phone: "+63 920 555 0181", channel: "Call", bestTime: "Morning", photoFile: "demo-provider-ronald.svg", color: "#1d4ed8" },
    { id: "demo-provider-camille", role: "provider", name: "Camille Dela Cruz", username: "camille.delacruz.demo", email: "camille.delacruz@example.com", area: "Barangay 24-A, Gingoog City", category: "Beauty, Event Services", phone: "+63 917 555 0162", channel: "Messenger", messenger: "https://m.me/camille.delacruz.demo", bestTime: "By appointment", photoFile: "demo-provider-camille.svg", color: "#be185d" },
  ];

  for (const user of users) {
    fs.writeFileSync(path.join(profileDir, user.photoFile), avatarSvg(user.name, user.color));
    await insertUser(db, user);
  }

  const providers = [
    { id: "demo-provider-profile-marco", userId: "demo-provider-marco", name: "Marco Padilla", displayName: "Marco Padilla Home Repair", category: "Plumbing, Electrical", area: "Barangay 18-A, Gingoog City", providerType: "Freelancer", services: "Leak repair, faucet replacement, outlet repair, light fixture installation", years: "6-10", coverage: "City proper, San Isidro, Lunao, Daan-Lungsod", emergency: "Sometimes", days: "Mon-Sat", time: "08:00-18:00", travel: "Can travel within Gingoog City proper and nearby barangays", minimumFee: "PHP 350", priceRange: "PHP 350 - PHP 2,500", trustLevel: "Verified" },
    { id: "demo-provider-profile-liza", userId: "demo-provider-liza", name: "Liza Orbeta", displayName: "Liza Home Cleaning", category: "Cleaning, Laundry", area: "Barangay Lunao, Gingoog City", providerType: "Small team", services: "Deep cleaning, move-in cleaning, laundry pickup, post-renovation cleaning", years: "3-5", coverage: "Lunao, Barangay 22, city proper, Daan-Lungsod", emergency: "No", days: "Mon-Sun", time: "07:00-17:00", travel: "Two-person team available for whole-house cleaning", minimumFee: "PHP 500", priceRange: "PHP 500 - PHP 3,500", trustLevel: "Verified" },
    { id: "demo-provider-profile-ronald", userId: "demo-provider-ronald", name: "Ronald Yap", displayName: "Ronald Appliance Care", category: "Appliance Repair, Aircon Services", area: "Barangay Santiago, Gingoog City", providerType: "Individual", services: "Aircon cleaning, refrigerator checkup, washing machine repair, small appliance diagnosis", years: "10+", coverage: "Santiago, San Luis, city proper, selected nearby barangays", emergency: "Sometimes", days: "Tue-Sun", time: "08:30-19:00", travel: "Same-day visit when parts are available", minimumFee: "PHP 450", priceRange: "PHP 450 - PHP 4,000", trustLevel: "Top Rated" },
    { id: "demo-provider-profile-camille", userId: "demo-provider-camille", name: "Camille Dela Cruz", displayName: "Camille Beauty Studio", category: "Beauty, Event Services", area: "Barangay 24-A, Gingoog City", providerType: "Freelancer", services: "Hair and makeup, simple event styling, graduation and family photo prep", years: "3-5", coverage: "Home service within Gingoog City by appointment", emergency: "No", days: "Fri-Sun", time: "06:00-20:00", travel: "Booking deposit required for early call time", minimumFee: "PHP 800", priceRange: "PHP 800 - PHP 5,000", trustLevel: "Verified" },
  ];
  for (const provider of providers) await insertProvider(db, provider);

  const requestMedia = [
    ["demo-request-sink.svg", "Sink leak photo", "Under-sink leak reference", "#eef7f5"],
    ["demo-completion-cleaning.svg", "Completion proof", "Cleaned kitchen and living area", "#f5f7ee"],
  ];
  for (const [file, title, subtitle, bg] of requestMedia) fs.writeFileSync(path.join(uploadDir, file), mediaSvg(title, subtitle, bg));

  const requests = [
    ["demo-job-aircon", "demo-client-jun", "Jun Velasco", "Aircon Services", "Today", "Barangay San Luis, Gingoog City", "900", "", "Call", "Blue gate near San Luis chapel", 8.826191, 125.103123, "Need split-type aircon cleaning before guests arrive this weekend.", "Offers Received", null, null, null, null, null, null, null, null, null, null, null, null, null, null, now(-330), now(-40)],
    ["demo-job-sink", "demo-client-maria", "Maria Santos", "Plumbing", "Today", "Barangay 22, Gingoog City", "700", "", "SMS", "Apartment 2B, beside pharmacy", 8.824377, 125.096702, "Kitchen sink has a steady leak under the cabinet. Please bring basic fittings.", "Countered", null, null, null, null, null, null, null, null, null, null, null, null, null, null, now(-270), now(-35)],
    ["demo-job-outlet", "demo-client-anne", "Anne Cabahug", "Electrical", "Scheduled", "Barangay Daan-Lungsod, Gingoog City", "850", "Tomorrow, 9:00 AM", "Messenger", "Ground floor unit, ask for Anne at the sari-sari store", 8.817906, 125.087033, "Replace one loose outlet and check a flickering dining light.", "Accepted", "demo-provider-marco", now(-150), null, null, null, null, null, null, null, null, null, null, null, null, now(-210), now(-55)],
    ["demo-job-paint", "demo-client-jun", "Jun Velasco", "Home Repair", "Scheduled", "Barangay San Luis, Gingoog City", "2300", "Today, 2:00 PM", "Call", "Small bedroom, one accent wall only", 8.826734, 125.101992, "Repaint one bedroom wall and patch two small nail holes before repainting.", "In Progress", "demo-provider-marco", now(-120), null, null, null, null, null, null, null, null, null, null, null, null, now(-180), now(-8)],
    ["demo-job-cleaning", "demo-client-maria", "Maria Santos", "Cleaning", "Today", "Barangay 22, Gingoog City", "1500", "", "SMS", "Two-bedroom home, focus kitchen and living area", 8.823891, 125.097614, "Deep clean kitchen tiles, living room windows, and bathroom. Supplies can be reimbursed.", "Provider Marked Done", "demo-provider-liza", now(-300), now(-25), now(120), null, null, "Kitchen, living room, and bathroom completed. Photos uploaded for review.", null, null, null, null, null, null, null, now(-360), now(-20)],
    ["demo-job-makeup", "demo-client-anne", "Anne Cabahug", "Beauty", "Scheduled", "Barangay Daan-Lungsod, Gingoog City", "1800", "Saturday, 6:30 AM", "Messenger", "Early call time for graduation pictorial", 8.818110, 125.086710, "Natural makeup and simple hair styling for graduation photos.", "Payment Released", "demo-provider-camille", now(-7200), now(-7050), now(-7020), now(-6900), now(7200), "Hair and makeup completed on schedule. Client confirmed final look.", null, null, null, null, null, null, null, now(-7600), now(-6900)],
    ["demo-job-ref", "demo-client-jun", "Jun Velasco", "Appliance Repair", "Today", "Barangay San Luis, Gingoog City", "1250", "", "Call", "Old refrigerator in back kitchen", 8.825811, 125.102441, "Refrigerator was not cooling properly and needed same-day diagnosis.", "Rated / Closed", "demo-provider-ronald", now(-14400), now(-14280), now(-14160), now(-14040), now(-10080), "Cleaned condenser area and replaced starter relay. Unit cooling normally after test.", null, 5, "Ronald explained the issue clearly and finished the repair the same afternoon.", 5, "Jun had the appliance ready and paid promptly.", now(-10120), now(-10090), now(-14600), now(-10080)],
  ];

  for (const row of requests) {
    await db.query(
      `INSERT INTO requests
        (id, client_id, client_name, category, urgency, area, budget, preferred_schedule, contact_method,
         exact_location_notes, job_lat, job_lng, job_location_source, permission_to_forward, consent_to_rate,
         details, status, accepted_provider_id, confirmed_at, provider_done_at, auto_confirm_at,
         payment_released_at, rating_deadline_at, proof_note, revision_note, client_rating_score,
         client_rating_note, provider_rating_score, provider_rating_note, client_rated_at, provider_rated_at,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row
    );
  }

  const offers = [
    ["demo-offer-aircon-ronald", "demo-job-aircon", "offer", "demo-provider-ronald", "Ronald Yap", "850", "Today, 4:00 PM", "Includes standard split-type cleaning and drain check.", 8.820615, 125.102866, now(-55), now(-52)],
    ["demo-offer-aircon-marco", "demo-job-aircon", "offer", "demo-provider-marco", "Marco Padilla", "950", "Today, 5:30 PM", "Can inspect bracket and wiring while cleaning.", 8.821931, 125.096220, now(-50), now(-48)],
    ["demo-offer-sink-marco", "demo-job-sink", "offer", "demo-provider-marco", "Marco Padilla", "650", "Today, within 1 hour", "Labor and basic sealant included. Parts at receipt cost if needed.", 8.821931, 125.096220, now(-220), now(-218)],
    ["demo-counter-sink-marco", "demo-job-sink", "counter", "demo-provider-marco", "Marco Padilla", "780", "Today, 11:30 AM", "Counter includes replacement flex hose after seeing the leak photo.", 8.821931, 125.096220, now(-70), now(-68)],
    ["demo-offer-outlet-marco", "demo-job-outlet", "offer", "demo-provider-marco", "Marco Padilla", "800", "Tomorrow, 9:00 AM", "Includes outlet replacement and basic light fixture check.", 8.821931, 125.096220, now(-170), now(-168)],
    ["demo-offer-paint-marco", "demo-job-paint", "offer", "demo-provider-marco", "Marco Padilla", "2200", "Today, 2:00 PM", "Includes patching, primer, and labor. Client provides paint color.", 8.821931, 125.096220, now(-160), now(-158)],
    ["demo-offer-cleaning-liza", "demo-job-cleaning", "offer", "demo-provider-liza", "Liza Orbeta", "1450", "Today, 8:30 AM", "Two cleaners, basic supplies included.", 8.829210, 125.096400, now(-340), now(-338)],
    ["demo-offer-makeup-camille", "demo-job-makeup", "offer", "demo-provider-camille", "Camille Dela Cruz", "1800", "Saturday, 6:30 AM", "Natural makeup, hair styling, lashes optional.", 8.819820, 125.093700, now(-7500), now(-7498)],
    ["demo-offer-ref-ronald", "demo-job-ref", "offer", "demo-provider-ronald", "Ronald Yap", "1250", "Today, 3:00 PM", "Diagnosis plus common starter relay replacement if needed.", 8.820615, 125.102866, now(-14550), now(-14548)],
  ];
  for (const offer of offers) {
    await db.query(
      `INSERT INTO offers
        (id, request_id, type, provider_id, provider_name, amount, schedule, notes,
         provider_lat, provider_lng, provider_location_captured_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      offer
    );
  }

  await db.query(
    `INSERT INTO job_navigation_states
      (request_id, provider_id, status, arrival_state, provider_lat, provider_lng, accuracy_meters,
       heading, speed_mps, distance_meters, eta_minutes, started_at, nearby_at, arrived_at,
       stopped_at, last_location_at, updated_at)
     VALUES
      ('demo-job-paint', 'demo-provider-marco', 'on_the_way', 'on_the_way', 8.824910, 125.099840, 9.5,
       72.0, 3.2, 920, 6, ?, NULL, NULL, NULL, ?, ?)`,
    [now(-18), now(-2), now(-2)]
  );

  const messages = [
    ["demo-msg-outlet-1", "demo-job-outlet", "demo-client-anne", "Anne Cabahug", "Hi Marco, tomorrow 9 AM still works for us.", now(-95)],
    ["demo-msg-outlet-2", "demo-job-outlet", "demo-provider-marco", "Marco Padilla", "Yes ma'am, I will bring a replacement outlet and tester.", now(-90)],
    ["demo-msg-paint-1", "demo-job-paint", "demo-provider-marco", "Marco Padilla", "I am on the way now. ETA around 6 minutes.", now(-9)],
    ["demo-msg-paint-2", "demo-job-paint", "demo-client-jun", "Jun Velasco", "Thanks. The guard knows you are coming.", now(-7)],
    ["demo-msg-clean-1", "demo-job-cleaning", "demo-provider-liza", "Liza Orbeta", "Cleaning is done. We uploaded the proof photos for review.", now(-21)],
    ["demo-msg-ref-1", "demo-job-ref", "demo-provider-ronald", "Ronald Yap", "The refrigerator is cooling again after the relay replacement.", now(-14150)],
    ["demo-msg-ref-2", "demo-job-ref", "demo-client-jun", "Jun Velasco", "Confirmed. Thank you for explaining the repair.", now(-14050)],
  ];
  for (const message of messages) {
    await db.query(
      "INSERT INTO job_messages (id, request_id, sender_id, sender_name, detail, kind, created_at) VALUES (?, ?, ?, ?, ?, 'text', ?)",
      message
    );
  }

  await db.query(
    `INSERT INTO request_attachments
      (id, request_id, stage, file_name, original_name, mime_type, size_bytes, created_at)
     VALUES
      ('demo-attach-sink', 'demo-job-sink', 'request', 'demo-request-sink.svg', 'sink-leak-reference.svg', 'image/svg+xml', 2400, ?),
      ('demo-attach-cleaning-proof', 'demo-job-cleaning', 'completion', 'demo-completion-cleaning.svg', 'cleaning-completion-proof.svg', 'image/svg+xml', 2600, ?)`,
    [now(-250), now(-20)]
  );

  await db.query(
    `INSERT INTO feed_posts
      (id, author_id, body, visibility, post_as_official, share_count, created_at, updated_at)
     VALUES
      ('demo-feed-welcome', 'demo-client-maria',
       'Tried KAILA for a same-day sink repair and got clear offers within minutes. Helpful for busy households around Gingoog.',
       'public', 0, 4, ?, ?)`,
    [now(-240), now(-240)]
  );
  await db.query(
    `INSERT INTO feed_post_comments
      (id, post_id, parent_comment_id, author_id, body, created_at)
     VALUES
      ('demo-feed-comment-1', 'demo-feed-welcome', NULL, 'demo-provider-marco',
       'Salamat, Maria. Clear photos and location notes really help providers quote accurately.', ?)`,
    [now(-210)]
  );
  await db.query(
    `INSERT INTO feed_post_reactions (post_id, user_id, reaction, created_at) VALUES
      ('demo-feed-welcome', 'demo-provider-marco', 'helpful', ?),
      ('demo-feed-welcome', 'demo-provider-liza', 'like', ?),
      ('demo-feed-welcome', 'demo-client-jun', 'interested', ?)`,
    [now(-205), now(-204), now(-203)]
  );
  await db.query(
    `INSERT INTO feed_comment_reactions (comment_id, user_id, reaction, created_at) VALUES
      ('demo-feed-comment-1', 'demo-client-maria', 'like', ?)`,
    [now(-200)]
  );

  const activities = [
    ["demo-act-1", "Demo request posted", "Maria Santos posted a plumbing request in Barangay 22.", now(-270)],
    ["demo-act-2", "Offer selected", "Anne Cabahug selected Marco Padilla for electrical work.", now(-150)],
    ["demo-act-3", "Live job tracking", "Marco Padilla is on the way to an in-progress home repair job.", now(-8)],
    ["demo-act-4", "Payment released", "A beauty service job was confirmed and payment was released.", now(-6900)],
  ];
  for (const activity of activities) {
    await db.query("INSERT INTO activities (id, title, detail, created_at) VALUES (?, ?, ?, ?)", activity);
  }

  const [counts] = await db.query(`
    SELECT 'users' AS table_name, COUNT(*) AS rows_count FROM users
    UNION ALL SELECT 'providers', COUNT(*) FROM providers
    UNION ALL SELECT 'requests', COUNT(*) FROM requests
    UNION ALL SELECT 'offers', COUNT(*) FROM offers
    UNION ALL SELECT 'job_messages', COUNT(*) FROM job_messages
    UNION ALL SELECT 'feed_posts', COUNT(*) FROM feed_posts
  `);
  console.table(counts);
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
