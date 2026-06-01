const CHANNEL = "kaila-mvp";
const STORAGE = {
  session: "kaila.deploy.session",
  socketUrl: "kaila.deploy.socketUrl",
  theme: "kaila.deploy.theme",
};
const SERVICE_CATEGORIES = ["Appliance repair", "Plumbing", "Electrical", "Computer repair", "Mechanical / motorcycle", "Carpentry / home maintenance", "Graphic / digital services", "General odd jobs"];
const URGENCY_OPTIONS = ["Emergency", "Today", "This Week", "Scheduled", "Flexible"];
const APP_TIME_ZONE = "Asia/Manila";

const state = {
  session: readJson(STORAGE.session, null),
  users: [],
  requests: [],
  providers: [],
  activity: [],
  socket: null,
  connected: false,
  attentionQueue: [],
  attentionTimer: null,
  attentionOpen: false,
  activeConversationId: null,
  typingTimer: null,
  typingSent: false,
  presenceTimer: null,
  theme: localStorage.getItem(STORAGE.theme) || "system",
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initializeTheme();
  bindEvents();
  initializeSocketUrl();
  await loadState();
  route(state.session ? "app" : "landing");
  connectSocket();
}

function bindEvents() {
  $$("[data-route]").forEach((el) => el.addEventListener("click", () => route(el.dataset.route)));
  $("[data-register-form]").addEventListener("submit", register);
  $("[data-register-form] [name='role']").addEventListener("change", toggleProviderCategory);
  $("[data-login-form]").addEventListener("submit", login);
  $("[data-logout]").addEventListener("click", logout);
  $("[data-open-live]").addEventListener("click", () => $("[data-live-panel]").hidden = false);
  $("[data-close-live]").addEventListener("click", () => $("[data-live-panel]").hidden = true);
  $("[data-reconnect]").addEventListener("click", () => connectSocket(true));
  $("[data-settings-tab]")?.addEventListener("shown.bs.tab", renderSettings);
  $("[data-settings-tab]")?.addEventListener("click", renderSettings);
}

function initializeTheme() {
  applyTheme(state.theme);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "system") applyTheme("system");
  });
}

function applyTheme(theme = "system") {
  state.theme = ["light", "dark", "system"].includes(theme) ? theme : "system";
  localStorage.setItem(STORAGE.theme, state.theme);
  const resolved = state.theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : state.theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = state.theme;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", resolved === "dark" ? "#10191d" : "#0f3e46");
}

function initializeSocketUrl() {
  const input = $("[data-socket-url]");
  input.value = normalizeSocketUrl(localStorage.getItem(STORAGE.socketUrl) || "") || defaultSocketUrl();
}

function apiBase() {
  return $("[data-socket-url]").value.trim().replace(/\/$/, "");
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.session?.id) headers["X-KAILA-User-Id"] = state.session.id;

  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function loadState() {
  try {
    const payload = await apiFetch("/api/state", { method: "GET" });
    applyServerState(payload);
    if (state.session && !state.users.some((user) => user.id === state.session.id)) {
      localStorage.removeItem(STORAGE.session);
      state.session = null;
    }
  } catch {
    addActivity("API offline", "Start kaila/socket and make sure MySQL is running.");
  }
}

function applyServerState(payload = {}) {
  state.users = payload.users || state.users || [];
  state.providers = payload.providers || [];
  state.requests = payload.requests || [];
  state.activity = payload.activities || state.activity || [];
  if (state.session) {
    const freshSession = state.users.find((user) => user.id === state.session.id);
    if (freshSession) {
      state.session = { ...state.session, ...freshSession };
      localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
    }
  }
  render();
}

function safeApplyState(payload = {}) {
  try {
    applyServerState(payload);
  } catch (error) {
    console.error("KAILA render failed after successful API request:", error);
  }
}

function route(name) {
  if (name === "app" && !state.session) name = "login";
  if (state.session && ["landing", "login", "register"].includes(name)) name = "app";
  $$("[data-view]").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  document.body.classList.toggle("app-mode", name === "app");
  toggleProviderCategory();
  render();
}

function toggleProviderCategory() {
  const role = $("[data-register-form] [name='role']")?.value;
  const field = $("[data-provider-category-field]");
  const select = field?.querySelector("select");
  if (!field || !select) return;

  const isProvider = role === "provider";
  field.hidden = !isProvider;
  select.required = isProvider;
  if (!isProvider) select.value = "";
}

async function register(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  data.category = Array.from(form.elements.category?.selectedOptions || []).map((option) => option.value).filter(Boolean);
  let payload;
  try {
    payload = await apiFetch("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    notify("Registration failed", error.message, "error");
    return;
  }

  state.session = payload.user;
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  safeApplyState(payload.state);
  form.reset();
  await successRedirect("Account created", "Welcome to KAILA.");
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  let payload;
  try {
    payload = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    notify("Login failed", error.message, "error");
    return;
  }

  state.session = payload.user;
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  safeApplyState(payload.state);
  form.reset();
  await successRedirect("Logged in", `Welcome back, ${state.session.name}.`);
}

async function logout() {
  const result = await modal({
    title: "Logout?",
    text: "You will return to the landing page.",
    icon: "question",
    confirmButtonText: "Logout",
  });
  if (!result.isConfirmed) return;

  localStorage.removeItem(STORAGE.session);
  state.session = null;
  await window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    icon: "success",
    title: "Logged out",
    showConfirmButton: false,
    timer: 900,
    timerProgressBar: true,
  });
  route("landing");
}

function render() {
  renderNav();
  renderTabs();
  renderActions();
  renderRequests();
  renderProviders();
  renderActivity();
  renderSettings();
  renderStats();
}

function renderNav() {
  const signedIn = Boolean(state.session);
  $("[data-current-user]").classList.toggle("d-none", !signedIn);
  $("[data-app-link]").classList.toggle("d-none", !signedIn);
  if (signedIn) $("[data-current-user]").textContent = `${state.session.name} (${state.session.role})`;
  const summary = $("[data-current-user-summary]");
  if (summary && signedIn) summary.textContent = `${state.session.name} - ${state.session.area || state.session.role}`;
  const userPhoto = $("[data-app-user-photo]");
  if (userPhoto) {
    userPhoto.src = signedIn && state.session.photoUrl ? `${apiBase()}${state.session.photoUrl}` : "assets/android-chrome-192x192.png";
    userPhoto.alt = signedIn ? `${state.session.name} photo` : "";
  }
}

function renderTabs() {
  const providersTab = $("[data-providers-tab]");
  if (!providersTab) return;
  const hideProviders = state.session?.role === "provider";
  providersTab.hidden = hideProviders;
  if (hideProviders && providersTab.querySelector(".nav-link")?.classList.contains("active")) {
    activateTab("#requests-pane");
  }
}

function activateTab(target) {
  $$(".compact-tabs .nav-link").forEach((tab) => tab.classList.toggle("active", tab.dataset.bsTarget === target));
  $$(".tab-pane").forEach((pane) => {
    const active = `#${pane.id}` === target;
    pane.classList.toggle("active", active);
    pane.classList.toggle("show", active);
  });
}

function renderActions() {
  const row = $("[data-action-row]");
  if (!row || !state.session) return;

  const actions = [];
  if (["client", "admin"].includes(state.session.role)) {
    actions.push(`<button class="btn btn-primary" type="button" data-new-request><i class="fa-solid fa-plus"></i><span>Post Request</span></button>`);
  }
  if (["provider", "admin"].includes(state.session.role)) {
    actions.push(`<button class="btn btn-outline-primary" type="button" data-provider-profile><i class="fa-solid fa-id-card"></i><span>${state.session.role === "provider" ? "Provider Profile" : "Add Provider"}</span></button>`);
  }
  actions.push(`<button class="btn btn-outline-secondary" type="button" data-team-note title="Post a short note to the shared Activity feed."><i class="fa-solid fa-note-sticky"></i><span>Team Note</span></button>`);
  row.innerHTML = actions.join("");

  $("[data-new-request]")?.addEventListener("click", openRequestModal);
  $("[data-provider-profile]")?.addEventListener("click", openProviderModal);
  $("[data-team-note]")?.addEventListener("click", openMessageModal);
  $("[data-dashboard-title]").textContent = `${capitalize(state.session.role)} Dashboard`;
  $("[data-role-pill]").textContent = state.session.role;
}

function renderStats() {
  $("[data-stats-row]").hidden = state.session?.role !== "admin";
  $("[data-request-count]").textContent = state.requests.length;
  $("[data-provider-count]").textContent = state.providers.length;
  $("[data-offer-count]").textContent = state.requests.reduce((total, request) => total + request.offers.length, 0);
}

function renderRequests() {
  const host = $("[data-request-list]");
  if (!host) return;
  const visible = state.session?.role === "provider"
    ? state.requests.filter(isVisibleToProvider)
    : state.requests;

  if (!visible.length) {
    host.innerHTML = emptyCard("No job requests yet", "Client requests will appear here in real time.");
    return;
  }

  const activeRequests = visible.filter((request) => request.status !== "Cancelled");
  const cancelledRequests = visible.filter((request) => request.status === "Cancelled");
  const requestCards = activeRequests.map(renderRequestCard).join("");
  const cancelledSection = cancelledRequests.length ? `
    <details class="k-card collapsed-section">
      <summary>
        <span>Cancelled requests</span>
        <small>${cancelledRequests.length}</small>
      </summary>
      <div class="stack mt-2">
        ${cancelledRequests.map(renderRequestCard).join("")}
      </div>
    </details>
  ` : "";

  host.innerHTML = `${requestCards || emptyCard("No active requests", "Cancelled requests are tucked below.")}${cancelledSection}`;

  bindRequestCardActions(host);
}

function renderRequestCard(request) {
  return `
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          <h3>${escapeHtml(request.category)}</h3>
          <p>${escapeHtml(request.details)}</p>
        </div>
        <span class="badge text-bg-${statusColor(request.status)} align-self-start">${escapeHtml(request.status)}</span>
      </div>
      ${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation)}
      <div class="meta">
        <span>${escapeHtml(request.area)}</span>
        <span>${escapeHtml(request.urgency)}</span>
        <span>${escapeHtml(formatCurrency(request.budget))}</span>
      </div>
      ${renderOffers(request)}
      ${renderAttachments("Request media", request.requestAttachments, request.id)}
      ${request.proofNote ? `<div class="offer"><strong>Proof / completion note</strong><div>${escapeHtml(request.proofNote)}</div></div>` : ""}
      ${renderAttachments("Completion media", request.completionAttachments, request.id)}
      ${request.revisionNote ? `<div class="offer"><strong>Revision requested</strong><div>${escapeHtml(request.revisionNote)}</div></div>` : ""}
      ${request.autoConfirmAt && request.status === "Provider Marked Done" ? `<div class="offer"><strong>Auto-confirm deadline</strong><div>${formatDateTime(request.autoConfirmAt)}</div></div>` : ""}
      ${renderRatings(request)}
      ${request.disputeNote ? `<div class="offer"><strong>Dispute note</strong><div>${escapeHtml(request.disputeNote)}</div></div>` : ""}
      ${renderAttachments("Dispute media", request.disputeAttachments, request.id)}
      <div class="card-actions">
        ${canAcceptClientPrice(request) ? `<button class="btn btn-sm btn-outline-success" data-accept-client-price="${request.id}">Accept Client Price</button>` : ""}
        ${canOffer(request) ? `<button class="btn btn-sm btn-outline-primary" data-offer="${request.id}">Offer</button>` : ""}
        ${canPass(request) ? `<button class="btn btn-sm btn-outline-secondary" data-pass="${request.id}">Decline/Pass</button>` : ""}
        ${canViewConversation(request) ? `<button class="btn btn-sm btn-outline-primary" data-conversation="${request.id}">Messages</button>` : ""}
        ${jobActionButtons(request)}
      </div>
    </article>
  `;
}

function bindRequestCardActions(host) {
  $$("[data-accept-client-price]", host).forEach((button) => button.addEventListener("click", () => acceptClientPrice(button.dataset.acceptClientPrice)));
  $$("[data-offer]", host).forEach((button) => button.addEventListener("click", () => openOfferModal(button.dataset.offer, "offer")));
  $$("[data-pass]", host).forEach((button) => button.addEventListener("click", () => passRequest(button.dataset.pass)));
  $$("[data-select-offer]", host).forEach((button) => button.addEventListener("click", () => confirmRequest(button.dataset.requestId, button.dataset.selectOffer)));
  $$("[data-media-open]", host).forEach((button) => button.addEventListener("click", () => openMediaViewer(button.dataset.requestId, button.dataset.mediaStage, Number(button.dataset.mediaIndex))));
  $$("[data-conversation]", host).forEach((button) => button.addEventListener("click", () => openConversation(button.dataset.conversation)));
  $$("[data-job-action]", host).forEach((button) => button.addEventListener("click", () => openJobAction(button.dataset.requestId, button.dataset.jobAction)));
}

function renderOffers(request) {
  if (!request.offers.length) return "";
  if (canSelectOffer(request)) {
    return `
      <section class="offers-section">
        <div class="offers-heading">
          <strong>Provider offers</strong>
          <span>${request.offers.length} candidate${request.offers.length === 1 ? "" : "s"}</span>
        </div>
        <div class="offers-grid">${request.offers.map((offer) => renderOffer(offer, request.id, true)).join("")}</div>
      </section>
    `;
  }
  return `<section class="offers-section"><strong>Your offer</strong><div class="offers-grid">${request.offers.map((offer) => renderOffer(offer, request.id, false)).join("")}</div></section>`;
}

function renderOffer(offer, requestId, selectable) {
  return `
    <article class="offer-card">
      <div class="offer-card-head">
        <span>${escapeHtml(offer.type === "counter" ? "Counter-offer" : "Offer")}</span>
      </div>
      ${renderIdentity(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offer.providerReputation, "compact")}
      <div class="offer-amount">${escapeHtml(formatCurrency(offer.amount))}</div>
      <div class="offer-schedule">${escapeHtml(offer.schedule || "Schedule TBD")}</div>
      ${offer.notes ? `<p>${escapeHtml(offer.notes)}</p>` : ""}
      ${selectable ? `<button class="btn btn-sm btn-success w-100" type="button" data-request-id="${requestId}" data-select-offer="${offer.id}">Select Offer</button>` : ""}
    </article>
  `;
}

function renderAttachments(title, attachments = [], requestId) {
  if (!attachments.length) return "";
  return `
    <div class="media-block">
      <div class="media-heading"><strong>${escapeHtml(title)}</strong><span>${attachments.length} file${attachments.length === 1 ? "" : "s"}</span></div>
      <div class="media-grid">
        ${attachments.map((attachment, index) => {
          const url = `${apiBase()}${attachment.url}`;
          const isVideo = attachment.mimeType.startsWith("video/");
          return `
            <button class="media-tile" type="button" data-request-id="${escapeAttribute(requestId)}" data-media-open data-media-stage="${escapeAttribute(attachment.stage)}" data-media-index="${index}">
              ${isVideo
                ? `<video muted preload="metadata" src="${escapeAttribute(url)}"></video><span class="media-type">Video</span>`
                : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(attachment.originalName)}"><span class="media-type">Photo</span>`}
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function attachmentListForStage(request, stage) {
  if (stage === "completion") return request?.completionAttachments || [];
  if (stage === "dispute") return request?.disputeAttachments || [];
  return request?.requestAttachments || [];
}

async function openMediaViewer(requestId, stage, startIndex = 0) {
  const request = state.requests.find((item) => item.id === requestId);
  const attachments = attachmentListForStage(request, stage);
  if (!attachments?.length) return;
  let index = Math.max(0, Math.min(startIndex, attachments.length - 1));

  while (index >= 0 && index < attachments.length) {
    const attachment = attachments[index];
    const url = `${apiBase()}${attachment.url}`;
    const isVideo = attachment.mimeType.startsWith("video/");
    const result = await window.Swal.fire({
      customClass: { popup: "kaila-popup media-popup" },
      title: stage === "completion" ? "Completion media" : stage === "dispute" ? "Dispute media" : "Request media",
      html: `
        <div class="media-viewer">
          ${isVideo
            ? `<video controls autoplay preload="metadata" src="${escapeAttribute(url)}"></video>`
            : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(attachment.originalName)}">`}
          <div class="media-viewer-meta">
            <strong>${isVideo ? "Video" : "Photo"}</strong>
            <span>${index + 1} of ${attachments.length}</span>
          </div>
        </div>
      `,
      showCloseButton: true,
      showCancelButton: index > 0,
      cancelButtonText: "Previous",
      showConfirmButton: index < attachments.length - 1,
      confirmButtonText: "Next",
      reverseButtons: false,
    });
    if (result.isConfirmed) index += 1;
    else if (result.dismiss === window.Swal.DismissReason.cancel) index -= 1;
    else break;
  }
}

function renderRatings(request) {
  const hasClientRating = Boolean(request.clientRatedAt);
  const hasProviderRating = Boolean(request.providerRatedAt);
  if (!hasClientRating && !hasProviderRating && request.status !== "Payment Released") return "";

  if (!request.ratingsVisible && (hasClientRating || hasProviderRating)) {
    const pending = [
      hasClientRating ? "Client submitted rating" : "Client rating pending",
      hasProviderRating ? "Provider submitted rating" : "Provider rating pending",
    ].join(" - ");
    return `<div class="offer"><strong>Blind ratings</strong><div>${escapeHtml(pending)}</div>${request.ratingDeadlineAt ? `<div>Visible after ${escapeHtml(formatDateTime(request.ratingDeadlineAt))} or when both rate.</div>` : ""}</div>`;
  }

  const parts = [];
  if (hasClientRating) parts.push(renderRatingLine("Client rated provider", request.clientRatingScore, request.clientRatingNote));
  if (hasProviderRating) parts.push(renderRatingLine("Provider rated client", request.providerRatingScore, request.providerRatingNote));
  if (!parts.length && request.ratingDeadlineAt) parts.push(`<div>Rating open until ${escapeHtml(formatDateTime(request.ratingDeadlineAt))}</div>`);
  return `<div class="offer"><strong>Ratings</strong>${parts.join("")}</div>`;
}

function renderRatingLine(label, score, note = "") {
  return `
    <div class="rating-row">
      <strong>${escapeHtml(label)}:</strong>
      <span class="rating-stars" aria-label="${escapeAttribute(score)} out of 5 stars">${ratingStars(score)}</span>
      ${note ? `<span class="rating-note-text">${escapeHtml(note)}</span>` : ""}
    </div>
  `;
}

function ratingStars(score) {
  const value = Math.max(0, Math.min(5, Number(score) || 0));
  return [1, 2, 3, 4, 5].map((star) => star <= Math.round(value) ? "&#9733;" : "&#9734;").join("");
}

function renderIdentity(name, photoUrl, reputationLabel, reputation, size = "") {
  return `
    <div class="user-identity ${escapeAttribute(size)}">
      <img class="user-avatar" src="${escapeAttribute(resolveMediaUrl(photoUrl))}" alt="${escapeAttribute(name)} photo">
      <div class="user-identity-copy">
        <strong>${escapeHtml(name)}</strong>
        ${renderReputationBadge(reputationLabel, reputation)}
      </div>
    </div>
  `;
}

function renderReputationBadge(label, reputation = {}, className = "") {
  const count = Number(reputation?.count || 0);
  const average = Number(reputation?.average);
  if (!count || !Number.isFinite(average)) {
    return `<span class="reputation-badge ${escapeAttribute(className)}" aria-label="${escapeAttribute(label)}: No reviews yet"><span class="reputation-stars">&#9734;&#9734;&#9734;&#9734;&#9734;</span><span>No reviews yet</span></span>`;
  }
  return `
    <span class="reputation-badge ${escapeAttribute(className)}" aria-label="${escapeAttribute(label)}: ${escapeAttribute(average.toFixed(1))} stars from ${count} review${count === 1 ? "" : "s"}">
      <span class="reputation-stars">${ratingStars(average)}</span>
      <span>${escapeHtml(average.toFixed(1))} (${count} review${count === 1 ? "" : "s"})</span>
    </span>
  `;
}

function resolveMediaUrl(url) {
  return url ? `${apiBase()}${url}` : "assets/android-chrome-192x192.png";
}

function userProfile(userId) {
  return state.users.find((user) => user.id === userId) || {};
}

function renderProviders() {
  const host = $("[data-provider-list]");
  if (!host) return;
  if (!state.providers.length) {
    host.innerHTML = emptyCard("No providers yet", "Registered providers will appear here.");
    return;
  }
  host.innerHTML = state.providers.map((provider) => `
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          ${renderIdentity(provider.name, provider.photoUrl, "Provider reputation", provider.reputation)}
          <p>${escapeHtml(provider.skills || "No skills added yet.")}</p>
        </div>
        <span class="badge text-bg-light align-self-start">${escapeHtml(provider.availability || "Available")}</span>
      </div>
      <div class="meta">
        ${categoryList(provider.category).map((category) => `<span>${escapeHtml(category)}</span>`).join("") || "<span>General</span>"}
        <span>${escapeHtml(provider.area)}</span>
      </div>
    </article>
  `).join("");
}

function renderSettings() {
  const host = $("[data-settings-panel]");
  if (!host || !state.session) return;
  const isProvider = ["provider", "admin"].includes(state.session.role);
  const photoUrl = state.session.photoUrl ? `${apiBase()}${state.session.photoUrl}` : "assets/android-chrome-192x192.png";
  try {
    host.innerHTML = `
    <form class="settings-card" data-settings-form>
      <div class="settings-head">
        <img class="profile-photo" src="${escapeAttribute(photoUrl)}" alt="">
        <div>
          <h3>Profile settings</h3>
          <p>Update your visible name, service area, and photo.</p>
          ${renderReputationBadge("Your reputation", state.session.reputation, "reputation-line")}
        </div>
      </div>
      <div class="settings-grid">
        <label><span>Name</span><input class="form-control" name="name" value="${escapeAttribute(state.session.name || "")}" required></label>
        <label><span>Area</span><input class="form-control" name="area" value="${escapeAttribute(state.session.area || "")}" required></label>
        ${isProvider ? `<label class="wide"><span>Service categories</span>${categorySelect("settings-category", false, state.session.category || "", true)}</label>` : ""}
        <label class="wide"><span>Theme</span>${select("settings-theme", ["System", "Light", "Dark"], capitalize(state.theme))}</label>
        <label class="wide"><span>Photo</span><input class="form-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
      </div>
      <div class="upload-preview settings-preview" data-settings-photo-preview></div>
      <button class="btn btn-primary" type="submit">Save Settings</button>
    </form>
  `;
    $("[data-settings-form]")?.addEventListener("submit", saveSettings);
    bindAttachmentPreview("[data-settings-form] [name='photo']", "[data-settings-photo-preview]", 1);
  } catch (error) {
    console.error("Settings render failed:", error);
    host.innerHTML = emptyCard("Settings unavailable", "Refresh the app and try again.");
  }
}

function renderActivity() {
  const html = state.activity.length
    ? state.activity.map((item) => `<article class="k-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join("")
    : emptyCard("No activity yet", "Real-time events will appear here.");
  $("[data-activity-feed]").innerHTML = html;
  $("[data-live-feed]").innerHTML = html;
}

async function openRequestModal() {
  const result = await modal({
    title: "Post request",
    html: `
      <div class="swal-form two">
        <label><span>Category</span>${categorySelect("request-category", true)}</label>
        <label><span>Urgency</span>${select("request-urgency", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Area</span><input id="request-area" class="form-control" value="${escapeAttribute(state.session.area)}"></label>
        <label><span>Budget</span><input id="request-budget" class="form-control" inputmode="decimal" placeholder="Open / ₱1,500.00"></label>
        <label class="wide"><span>Details</span><textarea id="request-details" class="form-control" rows="3"></textarea></label>
        <label class="wide"><span>Photos or videos (optional, up to 3 files)</span><input id="request-attachments" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label>
        <div class="wide upload-preview" data-request-attachment-preview></div>
      </div>
    `,
    confirmButtonText: "Post",
    didOpen: () => bindAttachmentPreview("#request-attachments", "[data-request-attachment-preview]", 3),
    preConfirm: async () => {
      const attachments = await readMediaAttachments("#request-attachments");
      if (!attachments) return false;
      const request = {
        category: $("#request-category").value,
        urgency: $("#request-urgency").value,
        area: $("#request-area").value.trim(),
        budget: normalizeCurrencyInput($("#request-budget").value) || "Open",
        details: $("#request-details").value.trim(),
        attachments,
      };
      if (!request.category || !request.area || !request.details) {
        window.Swal.showValidationMessage("Category, area, and details are required.");
        return false;
      }
      return request;
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch("/api/requests", { method: "POST", body: JSON.stringify(result.value) });
    applyServerState(payload.state);
    notify("Request posted", "", "success");
  } catch (error) {
    notify("Request failed", error.message, "error");
  }
}

async function openProviderModal() {
  const existing = state.providers.find((provider) => provider.userId === state.session.id);
  const result = await modal({
    title: existing ? "Update provider" : "Provider profile",
    html: `
      <div class="swal-form two">
        <label class="wide"><span>Categories</span>${categorySelect("provider-category", false, existing?.category || state.session.category, true)}</label>
        <label><span>Area</span><input id="provider-area" class="form-control" value="${escapeAttribute(existing?.area || state.session.area || "")}"></label>
        <label><span>Availability</span>${select("provider-availability", ["Today", "Weekdays", "Weekends", "Emergency only"], existing?.availability)}</label>
        <label class="wide"><span>Skills</span><textarea id="provider-skills" class="form-control" rows="3">${escapeHtml(existing?.skills || "")}</textarea></label>
      </div>
    `,
    confirmButtonText: "Save",
    preConfirm: () => {
      const provider = {
        category: selectedValues("#provider-category"),
        area: $("#provider-area").value.trim(),
        availability: $("#provider-availability").value,
        skills: $("#provider-skills").value.trim(),
      };
      if (!provider.category.length || !provider.area) {
        window.Swal.showValidationMessage("At least one category and area are required.");
        return false;
      }
      return provider;
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch("/api/providers", { method: "POST", body: JSON.stringify(result.value) });
    applyServerState(payload.state);
    notify("Provider saved", "", "success");
  } catch (error) {
    notify("Provider failed", error.message, "error");
  }
}

async function openOfferModal(requestId, type) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  const result = await modal({
    title: type === "counter" ? "Send counter-offer" : "Send offer",
    html: `
      <div class="swal-form">
        ${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation, "compact")}
        <label><span>Amount</span><input id="offer-amount" class="form-control" inputmode="decimal" placeholder="₱1,500.00"></label>
        <label><span>Schedule</span><input id="offer-schedule" class="form-control" placeholder="Today / scheduled"></label>
        <label><span>Notes</span><textarea id="offer-notes" class="form-control" rows="3"></textarea></label>
      </div>
    `,
    confirmButtonText: type === "counter" ? "Send Counter" : "Send Offer",
    preConfirm: () => {
      const offer = {
        type,
        amount: normalizeCurrencyInput($("#offer-amount").value),
        schedule: $("#offer-schedule").value.trim(),
        notes: $("#offer-notes").value.trim(),
      };
      if (!offer.amount) {
        window.Swal.showValidationMessage("Amount is required.");
        return false;
      }
      return offer;
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch(`/api/requests/${requestId}/offers`, { method: "POST", body: JSON.stringify(result.value) });
    applyServerState(payload.state);
    notify(type === "counter" ? "Counter sent" : "Offer sent", "", "success");
  } catch (error) {
    notify("Offer failed", error.message, "error");
  }
}

async function acceptClientPrice(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !hasClientPrice(request)) {
    openOfferModal(requestId, "offer");
    return;
  }
  const result = await modal({
    title: "Accept client price?",
    text: `Send an offer for ${formatCurrency(request.budget)}.`,
    icon: "question",
    confirmButtonText: "Accept Client Price",
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch(`/api/requests/${requestId}/offers`, {
      method: "POST",
      body: JSON.stringify({ type: "offer", amount: request.budget, notes: "Accepted client price" }),
    });
    applyServerState(payload.state);
    notify("Client price accepted", "", "success");
  } catch (error) {
    notify("Offer failed", error.message, "error");
  }
}

async function confirmRequest(requestId, offerId) {
  const request = state.requests.find((item) => item.id === requestId);
  const offer = request?.offers.find((item) => item.id === offerId);
  if (!request || !offer) return;
  const result = await modal({
    title: "Select this provider?",
    html: `
      <div class="text-start">
        ${renderIdentity(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offer.providerReputation, "compact")}
        <p class="mt-3 mb-0">${escapeHtml(formatCurrency(offer.amount))}. This confirms the job and opens messaging.</p>
      </div>
    `,
    icon: "question",
    confirmButtonText: "Select Offer",
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch(`/api/requests/${requestId}/confirm`, { method: "POST", body: JSON.stringify({ offerId }) });
    applyServerState(payload.state);
    notify("Offer accepted", "", "success");
  } catch (error) {
    notify("Confirm failed", error.message, "error");
  }
}

async function openConversation(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  state.activeConversationId = requestId;
  await setConversationPresence(requestId, true);
  const payload = await fetchConversation(requestId);
  if (!payload) {
    setConversationPresence(requestId, false);
    return;
  }

  await window.Swal.fire({
    customClass: { popup: "kaila-popup chat-popup" },
    title: `${request.category} messages`,
    html: conversationHtml(payload.messages, payload.writable, payload.activeUserIds, request),
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => bindConversationInput(requestId, payload.writable),
    willClose: () => closeConversationRoom(requestId),
  });
  state.activeConversationId = null;
}

async function fetchConversation(requestId) {
  try {
    return await apiFetch(`/api/requests/${requestId}/messages`, { method: "GET" });
  } catch (error) {
    notify("Messages failed", error.message, "error");
    state.activeConversationId = null;
    return null;
  }
}

function conversationHtml(messages, writable, activeUserIds = [], request = null) {
  const transcript = messages.length
    ? messages.map((message) => `
      <div class="chat-message ${message.senderId === state.session.id ? "mine" : ""}">
        <strong>${escapeHtml(message.senderName)}</strong>
        <span>${escapeHtml(formatDateTime(message.createdAt))}</span>
        <p>${escapeHtml(message.detail)}</p>
        ${writable ? `<button class="chat-reaction" type="button" data-chat-react="${message.id}">Like${message.reactions.length ? ` ${message.reactions.length}` : ""}</button>` : message.reactions.length ? `<span class="chat-reaction-count">Liked ${message.reactions.length}</span>` : ""}
      </div>
    `).join("")
    : `<p class="chat-empty">No messages yet.</p>`;

  return `
    <div class="chat-shell">
      ${conversationIdentityHtml(request)}
      <div class="chat-presence" data-chat-presence>${conversationPresenceText(activeUserIds)}</div>
      <div class="chat-transcript" data-chat-transcript>${transcript}</div>
      <div class="chat-typing" data-chat-typing></div>
      ${writable ? `
        <div class="chat-compose">
          <textarea class="form-control" rows="2" maxlength="2000" placeholder="Write a message" data-chat-input></textarea>
          <button class="btn btn-primary" type="button" data-chat-send>Send</button>
        </div>
      ` : `<div class="chat-archived">Conversation archived after job completion.</div>`}
    </div>
  `;
}

function conversationIdentityHtml(request) {
  if (!request) return "";
  const viewingAsClient = request.clientId === state.session.id;
  if (viewingAsClient && request.acceptedProviderId) {
    const provider = userProfile(request.acceptedProviderId);
    return `<div class="chat-reputation">${renderIdentity(provider.name || "Provider", request.acceptedProviderPhotoUrl || provider.photoUrl, "Provider reputation", request.acceptedProviderReputation || provider.reputation, "compact")}</div>`;
  }
  return `<div class="chat-reputation">${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation, "compact")}</div>`;
}

function bindConversationInput(requestId, writable) {
  scrollConversationToBottom();
  if (!writable) return;
  const input = $("[data-chat-input]");
  $("[data-chat-send]")?.addEventListener("click", () => sendConversationMessage(requestId));
  $$("[data-chat-react]").forEach((button) => button.addEventListener("click", () => toggleMessageReaction(requestId, button.dataset.chatReact)));
  input?.addEventListener("input", () => handleConversationKeystroke(requestId));
  input?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendConversationMessage(requestId);
  });
}

async function sendConversationMessage(requestId) {
  const input = $("[data-chat-input]");
  const detail = input?.value.trim();
  if (!detail) return;
  input.value = "";
  stopConversationTyping(requestId);
  try {
    await apiFetch(`/api/requests/${requestId}/messages`, { method: "POST", body: JSON.stringify({ detail }) });
    await refreshConversation(requestId);
  } catch (error) {
    notify("Message failed", error.message, "error");
  }
}

async function refreshConversation(requestId) {
  if (state.activeConversationId !== requestId || !window.Swal.isVisible()) return;
  const input = $("[data-chat-input]");
  const draft = input?.value || "";
  const selectionStart = input?.selectionStart || 0;
  const selectionEnd = input?.selectionEnd || 0;
  const restoreFocus = document.activeElement === input;
  const payload = await fetchConversation(requestId);
  const shell = $(".chat-shell");
  if (!payload || !shell) return;
  const request = state.requests.find((item) => item.id === requestId);
  shell.outerHTML = conversationHtml(payload.messages, payload.writable, payload.activeUserIds, request);
  bindConversationInput(requestId, payload.writable);
  const nextInput = $("[data-chat-input]");
  if (nextInput) {
    nextInput.value = draft;
    nextInput.setSelectionRange(selectionStart, selectionEnd);
    if (restoreFocus) nextInput.focus();
  }
}

function handleConversationKeystroke(requestId) {
  clearTimeout(state.typingTimer);
  if (!state.typingSent) {
    state.typingSent = true;
    sendTypingStatus(requestId, true);
  }
  state.typingTimer = setTimeout(() => stopConversationTyping(requestId), 1500);
}

function stopConversationTyping(requestId) {
  clearTimeout(state.typingTimer);
  if (!state.typingSent) return;
  state.typingSent = false;
  sendTypingStatus(requestId, false);
}

function sendTypingStatus(requestId, typing) {
  apiFetch(`/api/requests/${requestId}/typing`, { method: "POST", body: JSON.stringify({ typing }) }).catch(() => {});
}

async function toggleMessageReaction(requestId, messageId) {
  try {
    await apiFetch(`/api/requests/${requestId}/messages/${messageId}/reactions`, { method: "POST", body: "{}" });
    await refreshConversation(requestId);
  } catch (error) {
    notify("Reaction failed", error.message, "error");
  }
}

async function setConversationPresence(requestId, active) {
  clearInterval(state.presenceTimer);
  try {
    await apiFetch(`/api/requests/${requestId}/presence`, { method: "POST", body: JSON.stringify({ active }) });
    if (active) {
      state.presenceTimer = setInterval(() => {
        apiFetch(`/api/requests/${requestId}/presence`, { method: "POST", body: JSON.stringify({ active: true }) }).catch(() => {});
      }, 20000);
    }
  } catch {}
}

function closeConversationRoom(requestId) {
  stopConversationTyping(requestId);
  setConversationPresence(requestId, false);
}

async function updateConversationPresence(requestId) {
  if (state.activeConversationId !== requestId || !window.Swal.isVisible()) return;
  const payload = await fetchConversation(requestId);
  const host = $("[data-chat-presence]");
  if (payload && host) host.textContent = conversationPresenceText(payload.activeUserIds);
}

function conversationPresenceText(activeUserIds = []) {
  return activeUserIds.some((userId) => userId !== state.session.id)
    ? "Other party is viewing this conversation."
    : "Other party is not viewing this conversation.";
}

async function openJobAction(requestId, action) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;

  let body = { action };
  let title = "Continue?";
  let text = "";
  let confirmButtonText = "Continue";

  if (action === "start") {
    title = "Start job?";
    text = "This moves the confirmed job to In Progress.";
    confirmButtonText = "Start";
  } else if (action === "provider_complete") {
    const result = await completionPrompt();
    if (!result) return;
    body.note = result.note;
    body.attachments = result.attachments;
  } else if (action === "client_complete") {
    title = "Confirm completion?";
    text = "This releases payment and marks the job completed.";
    confirmButtonText = "Confirm Completion";
  } else if (action === "cancel") {
    const result = await notePrompt("Cancel request", "Reason or note", false, "Cancel Request");
    if (!result) return;
    body.note = result.note;
  } else if (action === "dispute") {
    const result = await disputePrompt();
    if (!result) return;
    body.note = result.note;
    body.attachments = result.attachments;
  } else if (action === "resolve_dispute") {
    const result = await notePrompt("Resolve dispute", "Resolution note", false, "Resolve");
    if (!result) return;
    body.note = result.note;
  } else if (action === "rate") {
    const result = await ratingPrompt();
    if (!result) return;
    body.score = result.score;
    body.note = result.note;
  } else if (action === "request_revision") {
    const result = await notePrompt("Request revision", "What should be corrected?", true, "Request Revision");
    if (!result) return;
    body.note = result.note;
  }

  if (!["cancel", "dispute", "resolve_dispute", "rate", "provider_complete", "request_revision"].includes(action)) {
    const result = await modal({ title, text, icon: "question", confirmButtonText });
    if (!result.isConfirmed) return;
  }

  try {
    const payload = await apiFetch(`/api/requests/${requestId}/action`, { method: "POST", body: JSON.stringify(body) });
    applyServerState(payload.state);
    notify("Job updated", "", "success");
  } catch (error) {
    notify("Action failed", error.message, "error");
  }
}

async function notePrompt(title, placeholder, required, confirmButtonText) {
  const result = await modal({
    title,
    input: "textarea",
    inputPlaceholder: placeholder,
    confirmButtonText,
    inputValidator: (value) => (required && !value.trim() ? "Note is required." : undefined),
  });
  return result.isConfirmed ? { note: (result.value || "").trim() } : null;
}

async function completionPrompt() {
  const result = await modal({
    title: "Mark job done",
    html: `
      <div class="swal-form">
        <label><span>Proof notes (optional)</span><textarea id="completion-note" class="form-control" rows="3" placeholder="Receipt, before/after details, time log, etc."></textarea></label>
        <label><span>Photos or videos (optional, up to 3 files)</span><input id="completion-attachments" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label>
        <div class="upload-preview" data-completion-attachment-preview></div>
      </div>
    `,
    confirmButtonText: "Mark Done",
    didOpen: () => bindAttachmentPreview("#completion-attachments", "[data-completion-attachment-preview]", 3),
    preConfirm: async () => {
      const attachments = await readMediaAttachments("#completion-attachments");
      return attachments ? { note: $("#completion-note").value.trim(), attachments } : false;
    },
  });
  return result.isConfirmed ? result.value : null;
}

async function disputePrompt() {
  const result = await modal({
    title: "Dispute job",
    html: `
      <div class="swal-form">
        <label><span>Issue</span><textarea id="dispute-note" class="form-control" rows="3" placeholder="Explain the issue"></textarea></label>
        <label><span>Photos or videos (optional, up to 3 files)</span><input id="dispute-attachments" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label>
        <div class="upload-preview" data-dispute-attachment-preview></div>
      </div>
    `,
    confirmButtonText: "Submit Dispute",
    didOpen: () => bindAttachmentPreview("#dispute-attachments", "[data-dispute-attachment-preview]", 3),
    preConfirm: async () => {
      const note = $("#dispute-note").value.trim();
      if (!note) {
        window.Swal.showValidationMessage("Dispute note is required.");
        return false;
      }
      const attachments = await readMediaAttachments("#dispute-attachments");
      return attachments ? { note, attachments } : false;
    },
  });
  return result.isConfirmed ? result.value : null;
}

async function readMediaAttachments(selector) {
  const files = Array.from($(selector)?.files || []);
  if (files.length > 3) {
    window.Swal.showValidationMessage("Upload up to 3 attachments.");
    return null;
  }
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      window.Swal.showValidationMessage("Each attachment must be 10 MB or smaller.");
      return null;
    }
  }
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  })));
}

async function readProfilePhoto(selector) {
  const file = $(selector)?.files?.[0];
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    window.Swal?.showValidationMessage?.("Profile photo must be JPG, PNG, or WebP.");
    throw new Error("Profile photo must be JPG, PNG, or WebP.");
  }
  if (file.size > 2 * 1024 * 1024) {
    window.Swal?.showValidationMessage?.("Profile photo must be 2 MB or smaller.");
    throw new Error("Profile photo must be 2 MB or smaller.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function bindAttachmentPreview(inputSelector, previewSelector, limit = 3) {
  const input = $(inputSelector);
  const preview = $(previewSelector);
  if (!input || !preview) return;
  let urls = [];
  const clearUrls = () => {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls = [];
  };
  const renderPreview = () => {
    clearUrls();
    const files = Array.from(input.files || []).slice(0, limit);
    preview.innerHTML = files.map((file) => {
      const url = URL.createObjectURL(file);
      urls.push(url);
      const isVideo = file.type.startsWith("video/");
      return `
        <div class="upload-thumb">
          ${isVideo ? `<video muted preload="metadata" src="${escapeAttribute(url)}"></video>` : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(file.name)}">`}
          <span>${escapeHtml(file.name)}</span>
        </div>
      `;
    }).join("");
  };
  input.addEventListener("change", renderPreview);
}

async function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  let photo = null;
  try {
    photo = await readProfilePhoto("[data-settings-form] [name='photo']");
  } catch (error) {
    notify("Photo not saved", error.message, "error");
    return;
  }
  const payload = {
    name: form.elements.name.value.trim(),
    area: form.elements.area.value.trim(),
    category: selectedValues("#settings-category"),
    ...(photo ? { photo } : {}),
  };
  applyTheme(($("#settings-theme")?.value || "System").toLowerCase());
  if (!payload.name || !payload.area) {
    notify("Settings incomplete", "Name and area are required.", "warning");
    return;
  }
  try {
    const response = await apiFetch("/api/profile", { method: "POST", body: JSON.stringify(payload) });
    state.session = response.user;
    localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
    applyServerState(response.state);
    notify("Settings saved", "", "success");
  } catch (error) {
    notify("Settings failed", error.message, "error");
  }
}

async function ratingPrompt() {
  const result = await modal({
    title: "Rate job",
    html: `
      <div class="swal-form">
        <div class="rating-field">
          <span>Rating</span>
          <div class="star-rating" role="radiogroup" aria-label="Rating">
            ${[1, 2, 3, 4, 5].map((score) => `<button class="star-button selected" type="button" role="radio" aria-checked="${score === 5}" aria-label="${score} star${score === 1 ? "" : "s"}" data-rating-star="${score}">&#9733;</button>`).join("")}
          </div>
          <input id="rating-score" type="hidden" value="5">
          <strong class="rating-label" data-rating-label>5 stars</strong>
        </div>
        <label><span>Review note</span><textarea id="rating-note" class="form-control" rows="3" placeholder="Optional feedback"></textarea></label>
      </div>
    `,
    confirmButtonText: "Submit Rating",
    didOpen: bindStarRating,
    preConfirm: () => ({ score: Number($("#rating-score").value), note: $("#rating-note").value.trim() }),
  });
  return result.isConfirmed ? result.value : null;
}

function bindStarRating() {
  const stars = $$("[data-rating-star]");
  const setRating = (score, focus = false) => {
    $("#rating-score").value = String(score);
    $("[data-rating-label]").textContent = `${score} star${score === 1 ? "" : "s"}`;
    stars.forEach((star) => {
      const selected = Number(star.dataset.ratingStar) <= score;
      star.classList.toggle("selected", selected);
      star.setAttribute("aria-checked", String(Number(star.dataset.ratingStar) === score));
    });
    if (focus) stars[score - 1]?.focus();
  };
  stars.forEach((star) => {
    star.addEventListener("click", () => setRating(Number(star.dataset.ratingStar)));
    star.addEventListener("keydown", (event) => {
      const current = Number($("#rating-score").value);
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      setRating(Math.max(1, Math.min(5, current + (event.key === "ArrowRight" ? 1 : -1))), true);
    });
  });
}

async function openMessageModal() {
  const result = await modal({
    title: "Team note",
    input: "textarea",
    inputPlaceholder: "Short note",
    confirmButtonText: "Send",
    inputValidator: (value) => (!value.trim() ? "Message is required." : undefined),
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch("/api/activity", { method: "POST", body: JSON.stringify({ detail: result.value.trim() }) });
    applyServerState(payload.state);
  } catch (error) {
    notify("Note failed", error.message, "error");
  }
}

function connectSocket(force = false) {
  const urlInput = $("[data-socket-url]");
  const savedUrl = localStorage.getItem(STORAGE.socketUrl) || "";
  const socketUrl = urlInput.value.trim() || normalizeSocketUrl(savedUrl) || defaultSocketUrl();
  urlInput.value = socketUrl;
  localStorage.setItem(STORAGE.socketUrl, socketUrl);
  if (force && state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  if (state.socket) return;
  loadSocketClient(socketUrl).then(() => {
    state.socket = window.io(socketUrl);
    state.socket.on("connect", () => {
      state.connected = true;
      $("[data-socket-dot]").classList.add("connected");
      state.socket.emit("subscribe", CHANNEL);
    });
    state.socket.on("disconnect", () => {
      state.connected = false;
      $("[data-socket-dot]").classList.remove("connected");
    });
    state.socket.on("kaila.state.updated", applyServerState);
    state.socket.on("kaila.request.created", handleRequestCreated);
    state.socket.on("kaila.provider.saved", loadState);
    state.socket.on("kaila.offer.saved", handleOfferSaved);
    state.socket.on("kaila.request.confirmed", loadState);
    state.socket.on("kaila.request.passed", loadState);
    state.socket.on("kaila.request.action", loadState);
    state.socket.on("kaila.message.saved", handleMessageSaved);
    state.socket.on("kaila.typing.changed", handleTypingChanged);
    state.socket.on("kaila.message.reaction", ({ requestId }) => refreshConversation(requestId));
    state.socket.on("kaila.presence.changed", ({ requestId }) => updateConversationPresence(requestId));
    state.socket.on("kaila.activity", (activity) => {
      if (!state.activity.some((item) => item.id === activity.id)) state.activity.unshift(activity);
      renderActivity();
    });
  }).catch(() => addActivity("Socket offline", "Start kaila/socket."));
}

function handleRequestCreated({ request } = {}) {
  loadState();
  if (!request || !state.session || request.clientId === state.session.id) return;
  if (!["provider", "admin"].includes(state.session.role)) return;
  if (state.session.role === "provider" && !providerMatchesRequest(request)) return;
  const client = userProfile(request.clientId);

  queueAttentionModal({
    icon: "info",
    title: "New job request",
    confirmButtonText: "Offer/Counter",
    onConfirm: () => openOfferModal(request.id, "offer"),
    ...(state.session.role === "provider" ? {
      denyButtonText: hasClientPrice(request) ? "Accept Client Price" : undefined,
      showDenyButton: hasClientPrice(request),
      onDeny: () => acceptClientPrice(request.id),
      cancelButtonText: "Decline/Pass",
      showCancelButton: true,
      onCancel: () => persistPassRequest(request.id),
    } : {}),
    html: `
      <div class="text-start">
        ${renderIdentity(request.clientName, request.clientPhotoUrl || client.photoUrl, "Client reputation", request.clientReputation || client.reputation)}
        <strong>${escapeHtml(request.category)}</strong>
        <p class="mb-2">${escapeHtml(request.details)}</p>
        <div class="small text-muted">${escapeHtml(request.area)} - ${escapeHtml(request.urgency)} - ${escapeHtml(formatCurrency(request.budget))}</div>
      </div>
    `,
  });
}

async function handleOfferSaved({ requestId, offer } = {}) {
  await loadState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !offer || !state.session || offer.providerId === state.session.id) return;
  if (request.clientId !== state.session.id && state.session.role !== "admin") return;

  const isCounter = offer.type === "counter";
  const enrichedOffer = request.offers.find((item) => item.providerId === offer.providerId) || offer;
  const provider = userProfile(offer.providerId);
  queueAttentionModal({
    icon: isCounter ? "warning" : "info",
    title: isCounter ? "New counter-offer" : "New offer received",
    html: `
      <div class="text-start">
        ${renderIdentity(offer.providerName, enrichedOffer.providerPhotoUrl || provider.photoUrl, "Provider reputation", enrichedOffer.providerReputation || provider.reputation)}
        <strong>${escapeHtml(formatCurrency(offer.amount))} for ${escapeHtml(request.category)}</strong>
        <p class="mb-2">${escapeHtml(offer.providerName)} - ${escapeHtml(offer.schedule || "Schedule TBD")}</p>
        ${offer.notes ? `<div class="small text-muted">${escapeHtml(offer.notes)}</div>` : ""}
      </div>
    `,
  });
}

function handleMessageSaved({ requestId, message } = {}) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !message || !state.session || message.senderId === state.session.id) return;
  if (!canViewConversation(request)) return;
  if (state.activeConversationId === requestId) {
    refreshConversation(requestId);
    return;
  }

  queueAttentionModal({
    icon: "info",
    title: "New job message",
    confirmButtonText: "Open messages",
    onConfirm: () => openConversation(requestId),
    html: `
      <div class="text-start">
        <strong>${escapeHtml(message.senderName)}</strong>
        <p class="mb-0">${escapeHtml(message.detail)}</p>
      </div>
    `,
  });
}

function handleTypingChanged({ requestId, senderId, senderName, typing } = {}) {
  if (requestId !== state.activeConversationId || senderId === state.session?.id) return;
  const host = $("[data-chat-typing]");
  if (host) host.textContent = typing ? `${senderName} is typing...` : "";
}

function queueAttentionModal(options) {
  state.attentionQueue.push(options);
  showNextAttentionModal();
}

function showNextAttentionModal() {
  if (state.attentionOpen || !state.attentionQueue.length) return;
  if (window.Swal.isVisible()) {
    clearTimeout(state.attentionTimer);
    state.attentionTimer = setTimeout(showNextAttentionModal, 250);
    return;
  }

  state.attentionOpen = true;
  const options = state.attentionQueue.shift();
  const { onConfirm, onCancel, onDeny, ...modalOptions } = options;
  window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    confirmButtonText: "View request",
    ...modalOptions,
  }).then((result) => {
    if (result.isConfirmed) {
      route("app");
      if (onConfirm) onConfirm();
    } else if (result.isDenied && onDeny) {
      route("app");
      onDeny();
    } else if (result.dismiss === window.Swal.DismissReason.cancel && onCancel) {
      onCancel();
    }
  }).finally(() => {
    state.attentionOpen = false;
    showNextAttentionModal();
  });
}

function defaultSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname || "localhost";
  return `${protocol}//${host}:6002`;
}

function normalizeSocketUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname) && !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return "";
    return value;
  } catch {
    return "";
  }
}

function loadSocketClient(socketUrl) {
  if (window.io) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${socketUrl.replace(/\/$/, "")}/socket.io/socket.io.js`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function addActivity(title, detail) {
  state.activity.unshift({ title, detail });
  state.activity = state.activity.slice(0, 30);
  renderActivity();
}

function canOffer(request) {
  return state.session && ["provider", "admin"].includes(state.session.role) && ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function hasClientPrice(request) {
  return Boolean(request.budget && request.budget.trim().toLowerCase() !== "open");
}

function canAcceptClientPrice(request) {
  return state.session?.role === "provider" && hasClientPrice(request) && canOffer(request);
}

function canPass(request) {
  return state.session?.role === "provider" && ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function isVisibleToProvider(request) {
  if (request.acceptedProviderId === state.session.id) return true;
  if (request.passedProviderIds?.includes(state.session.id)) return false;
  if (!providerMatchesRequest(request)) return false;
  return ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function providerMatchesRequest(request) {
  const provider = state.providers.find((item) => item.userId === state.session?.id);
  return categoryList(provider?.category).includes(request.category);
}

async function passRequest(requestId) {
  const result = await modal({
    title: "Pass this request?",
    text: "It will be removed from your wall.",
    icon: "question",
    confirmButtonText: "Decline/Pass",
  });
  if (result.isConfirmed) persistPassRequest(requestId);
}

async function persistPassRequest(requestId) {
  try {
    const payload = await apiFetch(`/api/requests/${requestId}/pass`, { method: "POST", body: "{}" });
    applyServerState(payload.state);
    notify("Request passed", "", "success");
  } catch (error) {
    notify("Pass failed", error.message, "error");
  }
}

function canSelectOffer(request) {
  return state.session && (request.clientId === state.session.id || state.session.role === "admin") && request.offers.length > 0 && ["Offers Received", "Countered"].includes(request.status);
}

function canViewConversation(request) {
  if (!state.session || !request.acceptedProviderId) return false;
  return state.session.role === "admin" || request.clientId === state.session.id || request.acceptedProviderId === state.session.id;
}

function jobActionButtons(request) {
  if (!state.session) return "";
  const buttons = [];
  const isClient = request.clientId === state.session.id;
  const isProvider = state.session.role === "admin" || request.acceptedProviderId === state.session.id;
  const add = (action, label, style = "outline-secondary") => {
    buttons.push(`<button class="btn btn-sm btn-${style}" data-request-id="${request.id}" data-job-action="${action}">${label}</button>`);
  };

  if (isProvider && request.status === "Accepted") add("start", "Start", "outline-primary");
  if (isProvider && ["Accepted", "In Progress", "Revision Requested"].includes(request.status)) add("provider_complete", "Job Done", "outline-success");
  if ((isClient || state.session.role === "admin") && request.status === "Provider Marked Done") add("client_complete", "Confirm Completion", "outline-success");
  if ((isClient || state.session.role === "admin") && request.status === "Provider Marked Done") add("request_revision", "Request Revision", "outline-warning");
  if ((isClient || state.session.role === "admin") && request.status === "Payment Released" && !request.clientRatedAt) add("rate", "Rate Provider", "outline-primary");
  if ((isProvider || state.session.role === "admin") && request.status === "Payment Released" && !request.providerRatedAt) add("rate", "Rate Client", "outline-primary");
  if ((isClient || state.session.role === "admin") && ["Posted", "Offers Received", "Countered", "Accepted"].includes(request.status)) add("cancel", "Cancel", "outline-danger");
  if ((isClient || isProvider || state.session.role === "admin") && ["Accepted", "In Progress", "Provider Marked Done", "Payment Released"].includes(request.status)) add("dispute", "Dispute", "outline-warning");
  if (state.session.role === "admin" && request.status === "Disputed") add("resolve_dispute", "Resolve", "outline-success");

  return buttons.join("");
}

function emptyCard(title, detail) {
  return `<article class="k-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></article>`;
}

function statusColor(status) {
  if (status === "Accepted") return "success";
  if (["In Progress", "Provider Marked Done", "Revision Requested"].includes(status)) return "primary";
  if (["Payment Released", "Rated", "Rated / Closed", "Resolved"].includes(status)) return "success";
  if (["Cancelled", "Disputed"].includes(status)) return "danger";
  if (status === "Countered") return "warning";
  if (status === "Offers Received") return "info";
  return "primary";
}

function select(id, options, selected = "", blank = "", multiple = false) {
  const selectedItems = categoryList(selected);
  return `<select id="${id}" class="form-select" ${multiple ? "multiple size=\"4\"" : ""}>${blank ? `<option value="">${blank}</option>` : ""}${options.map((item) => {
    const isSelected = multiple ? selectedItems.includes(item) : item === selected;
    return `<option value="${escapeAttribute(item)}" ${isSelected ? "selected" : ""}>${escapeHtml(item)}</option>`;
  }).join("")}</select>`;
}

function categorySelect(id, blank = false, selected = "", multiple = false) {
  return select(id, SERVICE_CATEGORIES, selected, blank ? "Choose category" : "", multiple);
}

function selectedValues(selector) {
  const element = $(selector);
  return element ? Array.from(element.selectedOptions).map((option) => option.value).filter(Boolean) : [];
}

function categoryList(value = "") {
  if (Array.isArray(value)) return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  return Array.from(new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean)));
}

function modal(options) {
  return window.Swal.fire({ customClass: { popup: "kaila-popup" }, showCancelButton: true, reverseButtons: true, focusConfirm: false, ...options });
}

async function successRedirect(title, text) {
  await window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    icon: "success",
    title,
    text,
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
  route("app");
}

function notify(title, text = "", icon = "info") {
  window.Swal.fire({ toast: true, position: "top-end", icon, title, text, showConfirmButton: false, timer: 2200 });
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-PH", { timeZone: APP_TIME_ZONE, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function normalizeCurrencyInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[₱,\s]/g, "").replace(/^php/i, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : raw;
}

function formatCurrency(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "open") return raw || "Open";
  const cleaned = raw.replace(/[₱,\s]/g, "").replace(/^php/i, "");
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return raw;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace("PHP", "₱").replace(/\s/g, "");
}

function scrollConversationToBottom() {
  const transcript = $("[data-chat-transcript]");
  if (transcript) transcript.scrollTop = transcript.scrollHeight;
}
