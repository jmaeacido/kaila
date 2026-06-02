const CHANNEL = "kaila-mvp";
const STORAGE = {
  session: "kaila.deploy.session",
  socketUrl: "kaila.deploy.socketUrl",
  theme: "kaila.deploy.theme",
};
const SERVICE_CATEGORIES = ["Appliance repair", "Plumbing", "Electrical", "Computer repair", "Mechanical / motorcycle", "Carpentry / home maintenance", "Graphic / digital services", "General odd jobs"];
const URGENCY_OPTIONS = ["Emergency", "Today", "This Week", "Scheduled", "Flexible"];
const APP_TIME_ZONE = "Asia/Manila";
const BARANGAY_COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const GEOGRAPHY_SOURCE = "assets/Gingoog City PSGC.xlsx";
const FALLBACK_GEOGRAPHY = {
  region: "Region X (Northern Mindanao)",
  city: "City of Gingoog",
  barangays: ["Agay-ayan", "Alagatan", "Anakan", "Bagubad", "Bakidbakid", "Bal-ason", "Bantaawan", "Binakalan", "Capitulangan", "Daan-Lungsod", "Hindangon", "Kalagonoy", "Kibuging", "Kipuntos", "Lawaan", "Lawit", "Libertad", "Libon", "Lunao", "Lunotan", "Malibud", "Malinao", "Maribucao", "Mimbuntong", "Mimbalagon", "Mimbunga", "Minsapinit", "Murallon", "Odiongan", "Pangasihan", "Pigsaluhan", "Barangay 1", "Barangay 10", "Barangay 11", "Barangay 12", "Barangay 13", "Barangay 14", "Barangay 15", "Barangay 16", "Barangay 17", "Barangay 18-A", "Barangay 19", "Barangay 2", "Barangay 20", "Barangay 21", "Barangay 22-A", "Barangay 23", "Barangay 24", "Barangay 25", "Barangay 26", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Punong", "Ricoro", "Samay", "San Juan", "San Luis", "San Miguel", "Santiago", "Talisay", "Talon", "Tinabalan", "Tinulongan", "Barangay 18", "Barangay 22", "Barangay 24-A", "Dinawehan", "Eureka", "Kalipay", "Kamanikan", "Kianlagan", "San Jose", "Sangalan", "Tagpako"],
};

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
  activeOfferPromptRequestId: null,
  activeConversationId: null,
  typingTimer: null,
  typingSent: false,
  presenceTimer: null,
  call: null,
  adminMetric: "",
  theme: localStorage.getItem(STORAGE.theme) || "system",
  geography: FALLBACK_GEOGRAPHY,
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

async function init() {
  registerServiceWorker();
  setupAttentionNotifications();
  initializeTheme();
  bindEvents();
  initializeSocketUrl();
  await loadGeography();
  renderRegisterAddress();
  await loadState();
  route(state.session ? "app" : "landing");
  connectSocket();
}

function setupAttentionNotifications() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  document.addEventListener("pointerdown", () => {
    Notification.requestPermission().catch(() => {});
  }, { once: true });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn("KAILA service worker registration failed:", error);
      });
  });
}

function bindEvents() {
  $$("[data-route]").forEach((el) => el.addEventListener("click", () => route(el.dataset.route)));
  $("[data-register-form]").addEventListener("submit", register);
  $("[data-register-form] [name='role']").addEventListener("change", toggleProviderCategory);
  $("[data-login-form]").addEventListener("submit", login);
  $$("[data-password-toggle]").forEach((button) => button.addEventListener("click", togglePasswordVisibility));
  $("[data-forgot-password]")?.addEventListener("click", openForgotPasswordModal);
  $("[data-logout]").addEventListener("click", logout);
  $("[data-open-live]").addEventListener("click", () => $("[data-live-panel]").hidden = false);
  $("[data-close-live]").addEventListener("click", () => $("[data-live-panel]").hidden = true);
  $("[data-reconnect]").addEventListener("click", () => connectSocket(true));
  $("[data-settings-tab]")?.addEventListener("shown.bs.tab", renderSettings);
  $("[data-settings-tab]")?.addEventListener("click", renderSettings);
}

function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const input = button.closest(".password-field")?.querySelector("input");
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  button.innerHTML = `<i class="fa-solid fa-${show ? "eye-slash" : "eye"}"></i>`;
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

async function loadGeography() {
  if (!window.XLSX) return;
  try {
    const response = await fetch(GEOGRAPHY_SOURCE);
    if (!response.ok) throw new Error("Geography source unavailable");
    const workbook = window.XLSX.read(await response.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const region = rows.find((row) => row["Geographic Level"] === "Reg")?.Name || FALLBACK_GEOGRAPHY.region;
    const city = rows.find((row) => row["Geographic Level"] === "City")?.Name || FALLBACK_GEOGRAPHY.city;
    const barangays = rows
      .filter((row) => row["Geographic Level"] === "Bgy" && row.Name)
      .map((row) => String(row.Name).trim())
      .filter(Boolean);
    if (barangays.length) state.geography = { region, city, barangays: sortedBarangays(barangays) };
  } catch (error) {
    console.warn("KAILA geography source failed; using fallback geography.", error);
  }
}

function renderRegisterAddress() {
  const host = $("[data-register-address]");
  if (!host) return;
  host.innerHTML = addressFields("register-address", state.session?.area || "");
  bindAddressGroup("register-address");
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
  if (!response.ok) {
    console.error("KAILA API error", { path, status: response.status, payload });
    throw new Error(payload.error || response.statusText || "Request failed");
  }
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
  if (!field) return;

  const isProvider = role === "provider";
  field.hidden = !isProvider;
  if (isProvider) renderCategoryChips("register-category", "");
  else field.querySelector("[data-register-category]").innerHTML = "";
}

async function register(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  data.category = selectedCategoryChips("register-category");
  data.area = addressValue("register-address");
  data.dataPrivacyConsent = form.elements.dataPrivacyConsent?.checked;
  data.validIdConsent = form.elements.validIdConsent?.checked;
  data.consentRequests = form.elements.consentRequests?.checked;
  data.consentRatings = form.elements.consentRatings?.checked;
  data.rulesAgreement = form.elements.rulesAgreement?.checked;
  if (String(data.password || "").length < 6) {
    notify("Registration failed", "Password must be at least 6 characters.", "warning");
    return;
  }
  if (!data.contactNumber || !data.preferredContactChannel || !data.dataPrivacyConsent) {
    notify("Registration failed", "Contact number, preferred contact channel, and data consent are required.", "warning");
    return;
  }
  if (data.role === "provider" && (!data.category.length || !data.specificServices || !data.coverageArea || !data.consentRequests || !data.consentRatings || !data.rulesAgreement)) {
    notify("Registration failed", "Provider category, services, coverage area, request consent, rating consent, and rules agreement are required.", "warning");
    return;
  }
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
  syncSocketIdentity();
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
  syncSocketIdentity();
  safeApplyState(payload.state);
  form.reset();
  await successRedirect("Logged in", `Welcome back, ${state.session.name}.`);
}

async function openForgotPasswordModal() {
  const result = await modal({
    title: "Reset password",
    html: `
      <div class="swal-form">
        <label><span>Username</span><input id="reset-username" class="form-control" autocomplete="username"></label>
        <label><span>Full name on account</span><input id="reset-name" class="form-control" autocomplete="name"></label>
        <label>
          <span>New password</span>
          <div class="password-field">
            <input id="reset-password" class="form-control" type="password" autocomplete="new-password">
            <button class="password-toggle" type="button" data-password-toggle aria-label="Show password">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </label>
      </div>
    `,
    confirmButtonText: "Reset Password",
    didOpen: () => {
      $$("[data-password-toggle]", window.Swal.getPopup()).forEach((button) => button.addEventListener("click", togglePasswordVisibility));
    },
    preConfirm: async () => {
      const payload = {
        username: $("#reset-username").value.trim(),
        name: $("#reset-name").value.trim(),
        password: $("#reset-password").value,
      };
      if (!payload.username || !payload.name || !payload.password) {
        window.Swal.showValidationMessage("Username, full name, and new password are required.");
        return false;
      }
      if (payload.password.length < 6) {
        window.Swal.showValidationMessage("Password must be at least 6 characters.");
        return false;
      }
      try {
        await apiFetch("/api/forgot-password", { method: "POST", body: JSON.stringify(payload) });
        return payload;
      } catch (error) {
        window.Swal.showValidationMessage(error.message);
        return false;
      }
    },
  });
  if (!result.isConfirmed) return;
  $("[data-login-form] [name='username']").value = result.value.username;
  notify("Password reset", "You can log in with your new password.", "success");
}

async function logout() {
  const result = await modal({
    title: "Logout?",
    text: "You will return to the landing page.",
    icon: "question",
    confirmButtonText: "Logout",
  });
  if (!result.isConfirmed) return;

  endAudioCall(false);
  localStorage.removeItem(STORAGE.session);
  state.session = null;
  syncSocketIdentity();
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
  renderClients();
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
    userPhoto.src = signedIn ? resolveMediaUrl(state.session.photoUrl) : "assets/android-chrome-192x192.png";
    userPhoto.alt = signedIn ? `${state.session.name} photo` : "";
  }
}

function renderTabs() {
  const providersTab = $("[data-providers-tab]");
  const clientsTab = $("[data-clients-tab]");
  if (!providersTab) return;
  const hideProviders = state.session?.role === "provider";
  providersTab.hidden = hideProviders;
  if (clientsTab) clientsTab.hidden = state.session?.role !== "admin";
  if (hideProviders && providersTab.querySelector(".nav-link")?.classList.contains("active")) {
    activateTab("#requests-pane");
  }
  if (state.session?.role !== "admin" && clientsTab?.classList.contains("active")) activateTab("#requests-pane");
}

function activateTab(target) {
  $$(".compact-tabs .nav-link").forEach((tab) => tab.classList.toggle("active", tab.dataset.bsTarget === target));
  $$(".tab-pane").forEach((pane) => {
    const active = `#${pane.id}` === target;
    pane.classList.toggle("active", active);
    pane.classList.toggle("show", active);
  });
}

function focusRequestCard(requestId, offerId = "") {
  route("app");
  activateTab("#requests-pane");
  requestAnimationFrame(() => {
    const card = $(`[data-request-card="${escapeCssIdentifier(requestId)}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("request-card-focus");
    setTimeout(() => card.classList.remove("request-card-focus"), 2200);
    if (offerId) {
      const offerCard = card.querySelector(`[data-offer-card="${escapeCssIdentifier(offerId)}"]`);
      offerCard?.classList.add("request-card-focus");
      setTimeout(() => offerCard?.classList.remove("request-card-focus"), 2200);
    }
  });
}

function renderActions() {
  const row = $("[data-action-row]");
  if (!row || !state.session) return;

  const actions = [];
  if (state.session.role === "client") {
    actions.push(`<button class="btn btn-primary" type="button" data-new-request><i class="fa-solid fa-plus"></i><span>Post Request</span></button>`);
  }
  if (state.session.role === "provider") {
    actions.push(`<button class="btn btn-outline-primary" type="button" data-provider-profile><i class="fa-solid fa-id-card"></i><span>${state.session.role === "provider" ? "Provider Profile" : "Add Provider"}</span></button>`);
  }
  if (state.session.role === "admin") {
    actions.push(`<button class="btn btn-primary" type="button" data-admin-create-account><i class="fa-solid fa-user-plus"></i><span>Create Account</span></button>`);
  }
  actions.push(`<button class="btn btn-outline-secondary" type="button" data-team-note title="Post a short note to the shared Activity feed."><i class="fa-solid fa-note-sticky"></i><span>Team Note</span></button>`);
  row.innerHTML = actions.join("");

  $("[data-new-request]")?.addEventListener("click", openRequestModal);
  $("[data-provider-profile]")?.addEventListener("click", openProviderModal);
  $("[data-admin-create-account]")?.addEventListener("click", openAdminCreateAccountModal);
  $("[data-team-note]")?.addEventListener("click", openMessageModal);
  $("[data-dashboard-title]").textContent = `${capitalize(state.session.role)} Dashboard`;
  $("[data-role-pill]").textContent = state.session.role;
}

function renderStats() {
  $("[data-stats-row]").hidden = state.session?.role !== "admin";
  if (state.session?.role !== "admin") return;
  const metrics = adminPilotMetrics();
  $("[data-active-provider-count]").textContent = metrics.activeProviders;
  $("[data-request-count]").textContent = metrics.requests;
  $("[data-response-rate]").textContent = `${metrics.responseRate}%`;
  $("[data-offers-per-request]").textContent = metrics.offersPerRequest;
  $("[data-completed-job-count]").textContent = metrics.completedJobs;
  $("[data-rating-average]").textContent = metrics.averageRating || "0";
  $("[data-dispute-count]").textContent = metrics.disputes;
  $("[data-gmv-total]").textContent = formatCurrency(metrics.gmv);
  $$("[data-admin-metric]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminMetric === state.adminMetric);
    button.onclick = () => openAdminMetric(button.dataset.adminMetric);
  });
}

function adminPilotMetrics() {
  const requests = state.requests || [];
  const providers = state.providers || [];
  const offersCount = requests.reduce((total, request) => total + visibleOffers(request).length, 0);
  const respondedRequests = requests.filter((request) => visibleOffers(request).length || request.passedProviderIds?.length).length;
  const completedStatuses = new Set(["Payment Released", "Rated / Closed", "Resolved"]);
  const completedRequests = requests.filter((request) => completedStatuses.has(request.status));
  const ratingScores = requests.flatMap((request) => [request.clientRatingScore, request.providerRatingScore])
    .map(Number)
    .filter((score) => Number.isFinite(score) && score > 0);
  const gmv = completedRequests.reduce((total, request) => total + selectedOfferAmount(request), 0);

  return {
    activeProviders: providers.filter((provider) => (provider.status || "Active") === "Active").length,
    requests: requests.length,
    responseRate: requests.length ? Math.round((respondedRequests / requests.length) * 100) : 0,
    offersPerRequest: requests.length ? (offersCount / requests.length).toFixed(1) : "0",
    completedJobs: completedRequests.length,
    averageRating: ratingScores.length ? (ratingScores.reduce((sum, score) => sum + score, 0) / ratingScores.length).toFixed(1) : "",
    disputes: requests.filter((request) => request.status === "Disputed" || request.disputeNote).length,
    gmv,
  };
}

function selectedOfferAmount(request) {
  const offer = visibleOffers(request).find((item) => item.providerId === request.acceptedProviderId) || visibleOffers(request)[0];
  return currencyNumber(offer?.amount || request.budget);
}

function openAdminMetric(metric) {
  if (state.session?.role !== "admin") return;
  state.adminMetric = metric;
  const providerMetric = ["active-providers", "response-rate", "ratings"].includes(metric);
  if (providerMetric) {
    activateTab("#providers-pane");
  } else {
    activateTab("#requests-pane");
  }
  render();
  requestAnimationFrame(() => {
    const target = providerMetric ? "[data-provider-list]" : "[data-request-list]";
    $(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderRequests() {
  const host = $("[data-request-list]");
  if (!host) return;
  let visible = state.session?.role === "provider"
    ? state.requests.filter(isVisibleToProvider)
    : state.requests;
  const adminPanel = state.session?.role === "admin" ? adminRequestMetricPanel() : "";
  if (state.session?.role === "admin") visible = adminMetricRequests(visible);

  if (!visible.length) {
    host.innerHTML = `${adminPanel}${emptyCard("No matching requests", "This metric has no matching request records yet.")}`;
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

  host.innerHTML = `${adminPanel}${requestCards || emptyCard("No active requests", "Cancelled requests are tucked below.")}${cancelledSection}`;

  bindRequestCardActions(host);
}

function adminMetricRequests(requests) {
  switch (state.adminMetric) {
    case "completed-jobs":
    case "gmv":
      return requests.filter((request) => ["Payment Released", "Rated / Closed", "Resolved"].includes(request.status));
    case "disputes":
      return requests.filter((request) => request.status === "Disputed" || request.disputeNote);
    case "offers-per-request":
      return [...requests].sort((left, right) => visibleOffers(right).length - visibleOffers(left).length);
    case "requests":
      return requests;
    default:
      return requests;
  }
}

function adminRequestMetricPanel() {
  const labels = {
    requests: ["Requests", "All client requests in the pilot tracker."],
    "offers-per-request": ["Offers per request", "Requests sorted by the number of visible provider offers."],
    "completed-jobs": ["Completed jobs", "Payment-released, rated, or resolved jobs."],
    disputes: ["Disputes", "Requests with dispute status or dispute notes."],
    gmv: ["GMV", "Completed jobs contributing to gross marketplace value."],
  };
  const entry = labels[state.adminMetric];
  if (!entry) return "";
  return `<article class="k-card admin-metric-panel"><h3>${escapeHtml(entry[0])}</h3><p>${escapeHtml(entry[1])}</p></article>`;
}

function renderRequestCard(request) {
  return `
    <article class="k-card" data-request-card="${escapeAttribute(request.id)}">
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
        ${request.preferredSchedule ? `<span>${escapeHtml(request.preferredSchedule)}</span>` : ""}
        <span>${escapeHtml(formatCurrency(request.budget))}</span>
      </div>
      ${state.session?.role === "admin" || state.session?.role === "ops" ? `
        <div class="offer">
          <strong>Ops intake</strong>
          <div>${escapeHtml(request.contactMethod || "No contact method")} ${request.exactLocationNotes ? `- ${escapeHtml(request.exactLocationNotes)}` : ""}</div>
          <small>Forwarding: ${request.permissionToForward ? "Allowed" : "No"} | Rating consent: ${request.consentToRate ? "Yes" : "No"}</small>
        </div>
      ` : ""}
      ${renderAdminRequestMetricDetail(request)}
      ${renderAcceptedProviderContact(request)}
      ${renderAcceptedClientContact(request)}
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

function renderAdminRequestMetricDetail(request) {
  if (state.session?.role !== "admin" || !state.adminMetric) return "";
  if (state.adminMetric === "offers-per-request") {
    return `<div class="offer"><strong>Offer activity</strong><div>${visibleOffers(request).length} visible offer${visibleOffers(request).length === 1 ? "" : "s"} for this request</div></div>`;
  }
  if (state.adminMetric === "gmv") {
    return `<div class="offer"><strong>GMV contribution</strong><div>${escapeHtml(formatCurrency(selectedOfferAmount(request)))} from selected or latest visible offer</div></div>`;
  }
  if (state.adminMetric === "completed-jobs") {
    return `<div class="offer"><strong>Completion tracking</strong><div>Status: ${escapeHtml(request.status)}${request.paymentReleasedAt ? ` - released ${escapeHtml(formatDateTime(request.paymentReleasedAt))}` : ""}</div></div>`;
  }
  if (state.adminMetric === "disputes") {
    return `<div class="offer"><strong>Dispute tracking</strong><div>${escapeHtml(request.disputeNote || request.status)}</div></div>`;
  }
  return "";
}

function renderAcceptedProviderContact(request) {
  const isClientOwner = state.session?.role === "client" && request.clientId === state.session.id;
  if (!isClientOwner || !request.acceptedProviderId) return "";
  const provider = userProfile(request.acceptedProviderId);
  const contact = request.acceptedProviderContact || {};
  const name = contact.name || provider.name || "Selected provider";
  const phone = contact.contactNumber || provider.contactNumber || "";
  const messenger = contact.messengerLink || provider.messengerLink || "";
  const channel = contact.preferredContactChannel || provider.preferredContactChannel || "";
  const bestTime = contact.bestContactTime || provider.bestContactTime || "";
  if (!phone && !messenger && !channel && !bestTime) return "";
  return `
    <div class="offer provider-contact-card">
      <strong>Selected provider contact</strong>
      <div>${escapeHtml(name)}</div>
      <div class="meta">
        ${phone ? `<span>${phoneLink(phone, channel)}</span>` : ""}
        ${messenger ? `<span>${escapeHtml(messenger)}</span>` : ""}
        ${channel ? `<span>${escapeHtml(channel)}</span>` : ""}
        ${bestTime ? `<span>${escapeHtml(bestTime)}</span>` : ""}
      </div>
    </div>
  `;
}

function renderAcceptedClientContact(request) {
  const isAcceptedProvider = state.session?.role === "provider" && request.acceptedProviderId === state.session.id;
  if (!isAcceptedProvider) return "";
  const contact = request.clientContact || {};
  const name = contact.name || request.clientName || "Client";
  const phone = contact.contactNumber || "";
  const messenger = contact.messengerLink || "";
  const channel = contact.preferredContactChannel || "";
  const bestTime = contact.bestContactTime || "";
  if (!phone && !messenger && !channel && !bestTime) return "";
  return `
    <div class="offer provider-contact-card">
      <strong>Client contact</strong>
      <div>${escapeHtml(name)}</div>
      <div class="meta">
        ${phone ? `<span>${phoneLink(phone, channel)}</span>` : ""}
        ${messenger ? `<span>${escapeHtml(messenger)}</span>` : ""}
        ${channel ? `<span>${escapeHtml(channel)}</span>` : ""}
        ${bestTime ? `<span>${escapeHtml(bestTime)}</span>` : ""}
      </div>
    </div>
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
  const offers = visibleOffers(request);
  if (!offers.length) return "";
  if (canSelectOffer(request)) {
    return `
      <section class="offers-section">
        <div class="offers-heading">
          <strong>Provider offers</strong>
          <span>${offers.length} candidate${offers.length === 1 ? "" : "s"}</span>
        </div>
        <div class="offers-grid">${offers.map((offer) => renderOffer(offer, request.id, true)).join("")}</div>
      </section>
    `;
  }
  return `<section class="offers-section"><strong>Your offer</strong><div class="offers-grid">${offers.map((offer) => renderOffer(offer, request.id, false)).join("")}</div></section>`;
}

function renderOffer(offer, requestId, selectable) {
  return `
    <article class="offer-card" data-offer-card="${escapeAttribute(offer.id)}">
      <div class="offer-card-head">
        <span>${escapeHtml(offer.type === "counter" ? "Counter-offer" : "Offer")}</span>
      </div>
      ${renderIdentity(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offerProviderReputation(offer), "compact")}
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
  const responseRate = Number(reputation?.responseRate);
  const responseText = Number.isFinite(responseRate) ? ` · ${responseRate}% response` : "";
  const responseAria = Number.isFinite(responseRate) ? `, ${responseRate}% response rate` : "";
  if (!count || !Number.isFinite(average)) {
    return `<span class="reputation-badge ${escapeAttribute(className)}" aria-label="${escapeAttribute(label)}: No reviews yet${escapeAttribute(responseAria)}"><span class="reputation-stars">&#9734;&#9734;&#9734;&#9734;&#9734;</span><span>No reviews yet${escapeHtml(responseText)}</span></span>`;
  }
  return `
    <span class="reputation-badge ${escapeAttribute(className)}" aria-label="${escapeAttribute(label)}: ${escapeAttribute(average.toFixed(1))} stars from ${count} review${count === 1 ? "" : "s"}${escapeAttribute(responseAria)}">
      <span class="reputation-stars">${ratingStars(average)}</span>
      <span>${escapeHtml(average.toFixed(1))} (${count} review${count === 1 ? "" : "s"})${escapeHtml(responseText)}</span>
    </span>
  `;
}

function resolveMediaUrl(url) {
  if (!url) return "assets/android-chrome-192x192.png";
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiBase()}${url}`;
}

function userProfile(userId) {
  return state.users.find((user) => user.id === userId) || {};
}

function renderProviders() {
  const host = $("[data-provider-list]");
  if (!host) return;
  let providers = state.providers;
  if (state.session?.role === "admin") providers = adminMetricProviders(providers);
  const adminPanel = state.session?.role === "admin" ? adminProviderMetricPanel() : "";
  if (!providers.length) {
    host.innerHTML = emptyCard("No providers yet", "Registered providers will appear here.");
    return;
  }
  host.innerHTML = `${adminPanel}${providers.map((provider) => `
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          ${renderIdentity(provider.displayName || provider.name, provider.photoUrl, "Provider reputation", providerReputation(provider))}
          <p>${escapeHtml(provider.specificServices || provider.skills || "No services added yet.")}</p>
        </div>
        <span class="badge text-bg-light align-self-start">${escapeHtml(provider.status || "Active")}</span>
      </div>
      <div class="meta">
        ${categoryList(provider.category).map((category) => `<span>${escapeHtml(category)}</span>`).join("") || "<span>General</span>"}
        <span>${escapeHtml(provider.area)}</span>
        <span>${escapeHtml(provider.trustLevel || "Listed")}</span>
        ${provider.yearsExperience ? `<span>${escapeHtml(provider.yearsExperience)} yrs</span>` : ""}
        ${provider.minimumFee ? `<span>${escapeHtml(provider.minimumFee)}</span>` : ""}
      </div>
      ${state.session?.role === "admin" ? `
        <div class="offer">
          <strong>Provider ops profile</strong>
          <div>${escapeHtml(provider.coverageArea || "No coverage area")} ${provider.availableDays ? `- ${escapeHtml(provider.availableDays)}` : ""} ${provider.availableTime ? `- ${escapeHtml(provider.availableTime)}` : ""}</div>
          <small>Requests: ${provider.consentRequests ? "Yes" : "No"} | Ratings: ${provider.consentRatings ? "Yes" : "No"} | Rules: ${provider.rulesAgreement ? "Yes" : "No"}</small>
        </div>
      ` : ""}
      ${renderAdminProviderMetricDetail(provider)}
    </article>
  `).join("")}`;
}

function adminMetricProviders(providers) {
  if (state.adminMetric === "active-providers") return providers.filter((provider) => (provider.status || "Active") === "Active");
  if (state.adminMetric === "response-rate") return [...providers].sort((left, right) => providerResponseStats(right).rate - providerResponseStats(left).rate);
  if (state.adminMetric === "ratings") return [...providers].sort((left, right) => Number(right.reputation?.average || 0) - Number(left.reputation?.average || 0));
  return providers;
}

function adminProviderMetricPanel() {
  const labels = {
    "active-providers": ["Active providers", "Providers currently marked Active."],
    "response-rate": ["Response rate per provider", "Matching requests compared with offer/pass replies."],
    ratings: ["Provider ratings", "Providers sorted by average rating."],
  };
  const entry = labels[state.adminMetric];
  if (!entry) return "";
  return `<article class="k-card admin-metric-panel"><h3>${escapeHtml(entry[0])}</h3><p>${escapeHtml(entry[1])}</p></article>`;
}

function renderAdminProviderMetricDetail(provider) {
  if (state.session?.role !== "admin" || !state.adminMetric) return "";
  if (state.adminMetric === "response-rate") {
    const stats = providerResponseStats(provider);
    return `
      <div class="offer">
        <strong>Response rate</strong>
        <div>${stats.rate}% response rate</div>
        <small>${stats.replies} replies / ${stats.matchingRequests} matching requests - ${stats.offers} offers, ${stats.passes} passes</small>
      </div>
    `;
  }
  if (state.adminMetric === "ratings") {
    return `<div class="offer"><strong>Rating</strong><div>${provider.reputation?.average || "No rating"} (${provider.reputation?.count || 0} reviews)</div></div>`;
  }
  if (state.adminMetric === "active-providers") {
    return `<div class="offer"><strong>Active status</strong><div>${escapeHtml(provider.status || "Active")} - ${escapeHtml(provider.trustLevel || "Listed")}</div></div>`;
  }
  return "";
}

function providerResponseStats(provider) {
  const categories = categoryList(provider.category);
  const matching = state.requests.filter((request) => categories.includes(request.category) && request.status !== "Cancelled");
  const offers = matching.filter((request) => visibleOffers(request).some((offer) => offer.providerId === provider.userId)).length;
  const passes = matching.filter((request) => request.passedProviderIds?.includes(provider.userId)).length;
  const replies = offers + passes;
  return {
    matchingRequests: matching.length,
    offers,
    passes,
    replies,
    rate: matching.length ? Math.round((replies / matching.length) * 100) : 0,
  };
}

function providerReputation(provider = {}) {
  const stats = providerResponseStats(provider);
  return { ...(provider.reputation || {}), responseRate: stats.rate };
}

function offerProviderReputation(offer = {}) {
  const provider = state.providers.find((item) => item.userId === offer.providerId);
  if (!provider) return offer.providerReputation || {};
  return { ...(offer.providerReputation || provider.reputation || {}), responseRate: providerResponseStats(provider).rate };
}

function acceptedProviderReputation(request = {}) {
  const provider = state.providers.find((item) => item.userId === request.acceptedProviderId);
  if (!provider) return request.acceptedProviderReputation || {};
  return { ...(request.acceptedProviderReputation || provider.reputation || {}), responseRate: providerResponseStats(provider).rate };
}

function renderClients() {
  const host = $("[data-client-list]");
  if (!host) return;
  if (state.session?.role !== "admin") {
    host.innerHTML = "";
    return;
  }

  const clients = state.users.filter((user) => user.role === "client");
  if (!clients.length) {
    host.innerHTML = emptyCard("No clients yet", "Registered clients will appear here.");
    return;
  }

  host.innerHTML = clients.map((client) => {
    const requests = state.requests.filter((request) => request.clientId === client.id);
    const activeCount = requests.filter((request) => !["Cancelled", "Rated / Closed", "Resolved"].includes(request.status)).length;
    return `
      <article class="k-card">
        <div class="d-flex justify-content-between gap-2">
          <div>
            ${renderIdentity(client.name, client.photoUrl, "Client reputation", client.reputation)}
            <p>${escapeHtml(client.username || "No username")} ${client.contactNumber ? `- ${escapeHtml(client.contactNumber)}` : ""}</p>
          </div>
          <span class="badge text-bg-light align-self-start">${requests.length} request${requests.length === 1 ? "" : "s"}</span>
        </div>
        <div class="meta">
          <span>${escapeHtml(client.area || "No area")}</span>
          ${client.preferredContactChannel ? `<span>${escapeHtml(client.preferredContactChannel)}</span>` : ""}
          ${client.bestContactTime ? `<span>${escapeHtml(client.bestContactTime)}</span>` : ""}
          <span>${activeCount} active</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderSettings() {
  const host = $("[data-settings-panel]");
  if (!host || !state.session) return;
  const isProvider = state.session.role === "provider";
  const isAdmin = state.session.role === "admin";
  const photoUrl = resolveMediaUrl(state.session.photoUrl);
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
        <label><span>Contact number</span><input class="form-control" name="contactNumber" value="${escapeAttribute(state.session.contactNumber || "")}"></label>
        <label><span>Messenger / Facebook</span><input class="form-control" name="messengerLink" value="${escapeAttribute(state.session.messengerLink || "")}"></label>
        <label><span>Preferred contact</span>${select("settings-contact-channel", ["Messenger", "SMS", "Call", "Email", "Other"], state.session.preferredContactChannel || "Messenger")}</label>
        <label><span>Best contact time</span><input class="form-control" name="bestContactTime" value="${escapeAttribute(state.session.bestContactTime || "")}"></label>
        ${isAdmin ? "" : `<label class="wide"><span>Address</span>${addressFields("settings-address", state.session.area || "")}</label>`}
        ${isProvider ? `<label class="wide"><span>Service categories</span>${categoryChips("settings-category", state.session.category || "")}</label>` : ""}
        <label class="wide"><span>Theme</span>${select("settings-theme", ["System", "Light", "Dark"], capitalize(state.theme))}</label>
        <label class="wide"><span>Photo</span><input class="form-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <label class="wide consent-line"><input type="checkbox" name="dataPrivacyConsent" ${state.session.dataPrivacyConsent ? "checked" : ""}> Data privacy consent for pilot matching</label>
      </div>
      <div class="upload-preview settings-preview" data-settings-photo-preview></div>
      <button class="btn btn-primary" type="submit">Save Settings</button>
    </form>
  `;
    $("[data-settings-form]")?.addEventListener("submit", saveSettings);
    bindCategoryChips("settings-category");
    bindAddressGroup("settings-address");
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
        <label><span>Preferred schedule</span>${select("request-schedule", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Contact method</span><input id="request-contact-method" class="form-control" value="${escapeAttribute(state.session.preferredContactChannel || state.session.contactNumber || "")}" placeholder="Messenger / SMS / Call"></label>
        <label class="wide"><span>Address</span>${addressFields("request-address", state.session.area)}</label>
        <label><span>Budget</span><input id="request-budget" class="form-control" inputmode="decimal" placeholder="Open / ₱1,500.00"></label>
        <label class="wide"><span>Exact location notes <small>(not forwarded too early)</small></span><textarea id="request-location-notes" class="form-control" rows="2"></textarea></label>
        <label class="wide"><span>Details</span><textarea id="request-details" class="form-control" rows="3"></textarea></label>
        <label class="wide"><span>Photos or videos (optional, up to 3 files)</span><input id="request-attachments" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label>
        <div class="wide upload-preview" data-request-attachment-preview></div>
        <label class="wide consent-line"><input id="request-forward-consent" type="checkbox" checked> Permission to forward request details to matching providers.</label>
        <label class="wide consent-line"><input id="request-rate-consent" type="checkbox" checked> I agree to rate after completion.</label>
      </div>
    `,
    confirmButtonText: "Post",
    didOpen: () => {
      bindAddressGroup("request-address");
      bindAttachmentPreview("#request-attachments", "[data-request-attachment-preview]", 3);
    },
    preConfirm: async () => {
      const attachments = await readMediaAttachments("#request-attachments");
      if (!attachments) return false;
      const request = {
        category: $("#request-category").value,
        urgency: $("#request-urgency").value,
        area: addressValue("request-address"),
        budget: normalizeCurrencyInput($("#request-budget").value) || "Open",
        preferredSchedule: $("#request-schedule").value,
        contactMethod: $("#request-contact-method").value.trim(),
        exactLocationNotes: $("#request-location-notes").value.trim(),
        permissionToForward: $("#request-forward-consent").checked,
        consentToRate: $("#request-rate-consent").checked,
        details: $("#request-details").value.trim(),
        attachments,
      };
      if (!request.category || !request.area || !request.details || !request.permissionToForward || !request.consentToRate) {
        window.Swal.showValidationMessage("Category, area, details, forwarding permission, and rating consent are required.");
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
        <label><span>Display name</span><input id="provider-display-name" class="form-control" value="${escapeAttribute(existing?.displayName || state.session.name || "")}"></label>
        <label><span>Provider type</span>${select("provider-type", ["Individual", "Freelancer", "Shop", "Small team", "Business"], existing?.providerType || "Individual")}</label>
        <label class="wide"><span>Categories</span>${categoryChips("provider-category", existing?.category || state.session.category)}</label>
        <label class="wide"><span>Address</span>${addressFields("provider-address", existing?.area || state.session.area || "")}</label>
        <label><span>Availability</span>${select("provider-availability", ["Today", "Weekdays", "Weekends", "Emergency only"], existing?.availability)}</label>
        <label><span>Experience</span>${select("provider-experience", ["Less than 1", "1-2", "3-5", "6-10", "10+"], existing?.yearsExperience || "1-2")}</label>
        <label><span>Emergency availability</span>${select("provider-emergency", ["Yes", "No", "Sometimes"], existing?.emergencyAvailability || "Sometimes")}</label>
        <label><span>Available days</span><input id="provider-days" class="form-control" value="${escapeAttribute(existing?.availableDays || "")}" placeholder="Mon-Sat"></label>
        <label><span>Available time</span><input id="provider-time" class="form-control" value="${escapeAttribute(existing?.availableTime || "")}" placeholder="Evenings only"></label>
        <label class="wide"><span>Specific services</span><textarea id="provider-services" class="form-control" rows="3">${escapeHtml(existing?.specificServices || existing?.skills || "")}</textarea></label>
        <label class="wide"><span>Coverage area</span><textarea id="provider-coverage" class="form-control" rows="2">${escapeHtml(existing?.coverageArea || "")}</textarea></label>
        <label class="wide"><span>Travel limits</span><textarea id="provider-travel" class="form-control" rows="2">${escapeHtml(existing?.travelLimits || "")}</textarea></label>
        <label><span>Minimum fee</span><input id="provider-minimum-fee" class="form-control" value="${escapeAttribute(existing?.minimumFee || "")}" placeholder="PHP 300"></label>
        <label><span>Price range</span><input id="provider-price-range" class="form-control" value="${escapeAttribute(existing?.priceRange || "")}" placeholder="PHP 500-800"></label>
        <label class="wide"><span>Work sample link</span><input id="provider-work-samples" class="form-control" value="${escapeAttribute(existing?.workSamples || "")}"></label>
        <label class="wide"><span>Certificate / permit link</span><input id="provider-certificate" class="form-control" value="${escapeAttribute(existing?.certificateProof || "")}"></label>
        <label class="wide consent-line"><input id="provider-valid-id" type="checkbox" ${existing?.validIdConsent ? "checked" : ""}> Optional ID may be used for verification.</label>
        <label class="wide consent-line"><input id="provider-consent-requests" type="checkbox" ${existing?.consentRequests ? "checked" : ""}> I agree to receive pilot job requests.</label>
        <label class="wide consent-line"><input id="provider-consent-ratings" type="checkbox" ${existing?.consentRatings ? "checked" : ""}> I agree to receive ratings.</label>
        <label class="wide consent-line"><input id="provider-rules" type="checkbox" ${existing?.rulesAgreement ? "checked" : ""}> I understand and agree to provider rules.</label>
      </div>
    `,
    confirmButtonText: "Save",
    didOpen: () => {
      bindCategoryChips("provider-category");
      bindAddressGroup("provider-address");
    },
    preConfirm: () => {
      const provider = {
        category: selectedCategoryChips("provider-category"),
        area: addressValue("provider-address"),
        availability: $("#provider-availability").value,
        skills: $("#provider-services").value.trim(),
        displayName: $("#provider-display-name").value.trim(),
        providerType: $("#provider-type").value,
        specificServices: $("#provider-services").value.trim(),
        yearsExperience: $("#provider-experience").value,
        coverageArea: $("#provider-coverage").value.trim(),
        emergencyAvailability: $("#provider-emergency").value,
        availableDays: $("#provider-days").value.trim(),
        availableTime: $("#provider-time").value.trim(),
        travelLimits: $("#provider-travel").value.trim(),
        minimumFee: $("#provider-minimum-fee").value.trim(),
        priceRange: $("#provider-price-range").value.trim(),
        workSamples: $("#provider-work-samples").value.trim(),
        certificateProof: $("#provider-certificate").value.trim(),
        validIdConsent: $("#provider-valid-id").checked,
        consentRequests: $("#provider-consent-requests").checked,
        consentRatings: $("#provider-consent-ratings").checked,
        rulesAgreement: $("#provider-rules").checked,
      };
      if (!provider.category.length || !provider.area || !provider.specificServices || !provider.coverageArea || !provider.consentRequests || !provider.consentRatings || !provider.rulesAgreement) {
        window.Swal.showValidationMessage("Category, area, services, coverage, request consent, rating consent, and rules agreement are required.");
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
        <label><span>Schedule</span>${select("offer-schedule", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Notes</span><textarea id="offer-notes" class="form-control" rows="3"></textarea></label>
      </div>
    `,
    confirmButtonText: type === "counter" ? "Send Counter" : "Send Offer",
    preConfirm: () => {
      const offer = {
        type,
        amount: normalizeCurrencyInput($("#offer-amount").value),
        schedule: $("#offer-schedule").value,
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
  const offer = visibleOffers(request).find((item) => item.id === offerId);
  if (!request || !offer) return;
  if (request.passedProviderIds?.includes(offer.providerId)) {
    notify("Offer unavailable", "This provider already declined the request.", "warning");
    return;
  }
  const result = await modal({
    title: "Select this provider?",
    html: `
      <div class="text-start">
        ${renderIdentity(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offerProviderReputation(offer), "compact")}
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
      ${writable ? `
        <div class="chat-call-row">
          <span>Need to clarify the job?</span>
          <div class="chat-call-actions">
            <button class="btn btn-sm btn-outline-primary" type="button" data-audio-call="${request?.id || ""}">
              <i class="fa-solid fa-phone"></i> Audio Call
            </button>
            <button class="btn btn-sm btn-outline-primary" type="button" data-video-call="${request?.id || ""}">
              <i class="fa-solid fa-video"></i> Video Call
            </button>
          </div>
        </div>
      ` : ""}
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
    return `<div class="chat-reputation">${renderIdentity(provider.name || "Provider", request.acceptedProviderPhotoUrl || provider.photoUrl, "Provider reputation", acceptedProviderReputation(request), "compact")}</div>`;
  }
  return `<div class="chat-reputation">${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation, "compact")}</div>`;
}

function bindConversationInput(requestId, writable) {
  scrollConversationToBottom();
  $("[data-audio-call]")?.addEventListener("click", () => startAudioCall(requestId));
  $("[data-video-call]")?.addEventListener("click", () => startVideoCall(requestId));
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

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let callTone = null;
let callClockTimer = null;
let callQualityTimer = null;
let attentionTone = null;

function callSupported() {
  return Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
}

function audioCallUnavailableMessage() {
  if (!window.isSecureContext) {
    return "Microphone access requires HTTPS on Android Chrome. Open KAILA from an HTTPS URL, including its socket/API endpoint.";
  }
  return "This browser does not support WebRTC audio calls.";
}

async function startAudioCall(requestId) {
  return startCall(requestId, false);
}

async function startVideoCall(requestId) {
  return startCall(requestId, true);
}

async function startCall(requestId, withVideo = false) {
  if (!callSupported()) return notify("Audio call unavailable", audioCallUnavailableMessage(), "warning");
  if (!state.connected || !state.socket) return notify("Audio call unavailable", "Reconnect the live socket before calling.", "warning");
  if (state.call) return notify("Call already active", "End the current call before starting another.", "warning");
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !canViewConversation(request)) return;
  try {
    if (!await callRecipientIsOnline(requestId)) {
      return notify("Audio call", "The other party is offline.", "info");
    }
    const call = createCallState(requestId, createBrowserId(), "outgoing", conversationOtherPartyName(request), conversationOtherPartyPhoto(request), withVideo);
    state.call = call;
    renderCallPanel();
    startCallTone("outgoing");
    scheduleCallTimeout(call);
    call.localStream = await acquireCallMedia(withVideo);
    call.localVideoEnabled = Boolean(call.localStream.getVideoTracks().length);
    call.requestedVideo = call.localVideoEnabled;
    await refreshCallCameraAvailability(call);
    renderCallPanel();
    call.peerConnection = createPeerConnection(call);
    call.localStream.getTracks().forEach((track) => {
      const sender = call.peerConnection.addTrack(track, call.localStream);
      if (track.kind === "video") {
        call.videoSender = sender;
        monitorLocalVideoTrack(call, track);
      }
    });
    const offer = await call.peerConnection.createOffer();
    await call.peerConnection.setLocalDescription(offer);
    emitCallSignal("offer", { description: call.peerConnection.localDescription, withVideo: call.localVideoEnabled });
  } catch (error) {
    endAudioCall(false);
    notify("Call failed", microphoneErrorText(error), "error");
  }
}

function callRecipientIsOnline(requestId) {
  return new Promise((resolve) => {
    state.socket.timeout(4000).emit("kaila.call.check", { requestId }, (error, response = {}) => resolve(!error && response.ok));
  });
}

function createCallState(requestId, callId, direction, otherName, otherPhotoUrl = "", withVideo = false) {
  return {
    requestId,
    callId,
    direction,
    otherName: otherName || "Job contact",
    otherPhotoUrl,
    status: direction === "incoming" ? "incoming" : "ringing",
    muted: false,
    localVideoEnabled: withVideo,
    cameraFacingMode: "user",
    availableVideoInputs: 0,
    cameraRecoveryTimer: null,
    remoteRecoveryTimer: null,
    recoveringLocalVideo: false,
    cameraRecoverySuppressed: false,
    lastCameraRecoveryAt: 0,
    remoteVideoEnabled: false,
    remoteVideoExpected: direction === "incoming" && withVideo,
    remoteVideoPaused: false,
    requestedVideo: withVideo,
    remoteStream: new MediaStream(),
    qualityBadSamples: 0,
    cameraStallSamples: 0,
    qualityWarningShown: false,
    lastVideoStats: null,
    minimized: false,
    miniVideoPosition: null,
    connectedAt: null,
    localStream: null,
    peerConnection: null,
    videoSender: null,
    pendingCandidates: [],
  };
}

function callMediaConstraints(withVideo = false, facingMode = "user") {
  return {
    audio: true,
    video: withVideo ? {
      facingMode: { ideal: facingMode },
      width: { ideal: 640, max: 960 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 18, max: 24 },
    } : false,
  };
}

async function acquireCallMedia(withVideo = false, facingMode = "user") {
  if (!withVideo) return navigator.mediaDevices.getUserMedia(callMediaConstraints(false));
  try {
    return await navigator.mediaDevices.getUserMedia(callMediaConstraints(true, facingMode));
  } catch (error) {
    notify("Camera unavailable", `${cameraErrorText(error)} Continuing with audio only.`, "warning");
    return navigator.mediaDevices.getUserMedia(callMediaConstraints(false));
  }
}

function createBrowserId() {
  return window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createPeerConnection(call) {
  const peer = new RTCPeerConnection(RTC_CONFIG);
  peer.addEventListener("icecandidate", ({ candidate }) => {
    if (candidate) emitCallSignal("candidate", { candidate });
  });
  peer.addEventListener("track", ({ streams, track }) => {
    if (!call.remoteStream.getTracks().some((item) => item.id === track.id)) call.remoteStream.addTrack(track);
    track.addEventListener("ended", () => {
      call.remoteStream.removeTrack(track);
      if (track.kind !== "video") return;
      call.remoteVideoEnabled = false;
      call.remoteVideoPaused = call.remoteVideoExpected;
      renderCallPanel();
    });
    track.addEventListener("mute", () => {
      if (track.kind !== "video") return;
      call.remoteVideoPaused = true;
      scheduleRemoteVideoRecoveryRequest(call);
      updateCallVideoWaiting(call);
    });
    track.addEventListener("unmute", () => {
      if (track.kind !== "video") return;
      call.remoteVideoEnabled = true;
      call.remoteVideoPaused = false;
      clearTimeout(call.remoteRecoveryTimer);
      updateCallVideoWaiting(call);
    });
    if (track.kind === "video") {
      call.remoteVideoExpected = true;
      call.remoteVideoEnabled = true;
      call.remoteVideoPaused = track.muted;
    }
    syncCallMedia(call);
    renderCallPanel();
  });
  peer.addEventListener("connectionstatechange", () => {
    if (!state.call || state.call.callId !== call.callId) return;
    if (peer.connectionState === "connected") {
      clearTimeout(call.ringingTimer);
      stopCallTone();
      call.status = "connected";
      call.minimized = false;
      call.connectedAt ||= Date.now();
      startCallClock();
      startCallQualityMonitor(call);
      renderCallPanel();
    }
    if (["failed", "closed"].includes(peer.connectionState)) endAudioCall(false);
    if (peer.connectionState === "disconnected") {
      call.status = "reconnecting";
      renderCallPanel();
    }
  });
  return peer;
}

function ensureRemoteAudio() {
  let audio = $("[data-call-audio]");
  if (audio) return audio;
  audio = document.createElement("audio");
  audio.dataset.callAudio = "";
  audio.autoplay = true;
  document.body.appendChild(audio);
  return audio;
}

function syncCallMedia(call = state.call) {
  if (!call) return;
  const audio = ensureRemoteAudio();
  audio.srcObject = call.remoteStream;
  audio.play().catch(() => {});
  const remoteVideo = $("[data-call-remote-video]");
  if (remoteVideo) {
    remoteVideo.srcObject = call.remoteStream;
    remoteVideo.addEventListener("playing", () => {
      call.remoteVideoPaused = false;
      clearTimeout(call.remoteRecoveryTimer);
      updateCallVideoWaiting(call);
    });
    remoteVideo.addEventListener("waiting", () => {
      call.remoteVideoPaused = true;
      scheduleRemoteVideoRecoveryRequest(call);
      updateCallVideoWaiting(call);
    });
    remoteVideo.addEventListener("stalled", () => {
      call.remoteVideoPaused = true;
      scheduleRemoteVideoRecoveryRequest(call);
      updateCallVideoWaiting(call);
    });
    remoteVideo.play().catch(() => {});
  }
  const localVideo = $("[data-call-local-video]");
  if (localVideo) {
    localVideo.srcObject = call.localStream;
    localVideo.play().catch(() => {});
  }
  updateCallVideoWaiting(call);
}

async function refreshCallCameraAvailability(call = state.call) {
  if (!call || !navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (state.call?.callId !== call.callId) return;
    const availableVideoInputs = devices.filter((device) => device.kind === "videoinput").length;
    if (call.availableVideoInputs === availableVideoInputs) return;
    call.availableVideoInputs = availableVideoInputs;
    renderCallPanel();
  } catch {}
}

navigator.mediaDevices?.addEventListener?.("devicechange", () => refreshCallCameraAvailability());

function updateCallVideoWaiting(call = state.call) {
  const waiting = $("[data-call-video-waiting]");
  if (!waiting || !call || state.call?.callId !== call.callId) return;
  waiting.hidden = !call.remoteVideoPaused;
}

function scheduleRemoteVideoRecoveryRequest(call) {
  if (!state.call || state.call.callId !== call.callId || !call.remoteVideoExpected) return;
  clearTimeout(call.remoteRecoveryTimer);
  call.remoteRecoveryTimer = setTimeout(() => emitCallSignal("video-stalled"), 3000);
}

function renderCallPanel() {
  let panel = $("[data-call-panel]");
  if (!state.call) {
    panel?.remove();
    document.body.classList.remove("call-overlay-open");
    const audio = $("[data-call-audio]");
    if (audio) {
      audio.srcObject = null;
      audio.remove();
    }
    stopCallQualityMonitor();
    return;
  }
  if (!panel) {
    panel = document.createElement("aside");
    panel.dataset.callPanel = "";
    panel.className = "audio-call-panel";
    document.body.appendChild(panel);
  }
  const call = state.call;
  const incoming = call.status === "incoming";
  const onCall = ["connected", "reconnecting"].includes(call.status);
  const minimized = call.minimized;
  const showRemoteVideo = (onCall && call.remoteVideoExpected) || call.remoteVideoEnabled;
  const callLabel = call.requestedVideo || call.localVideoEnabled || call.remoteVideoEnabled ? "video call" : "audio call";
  const status = incoming ? `Incoming ${callLabel}` : call.status === "ringing" ? "Calling..." : call.status === "connected" ? `${capitalize(callLabel)} connected` : call.status === "connecting" ? "Connecting..." : "Reconnecting...";
  panel.className = `audio-call-panel${!minimized ? " audio-call-overlay" : ""}${minimized ? " minimized" : ""}${showRemoteVideo && !minimized ? " video-active" : ""}${showRemoteVideo && minimized ? " video-minimized" : ""}`;
  document.body.classList.toggle("call-overlay-open", !minimized);
  if (minimized) {
    panel.innerHTML = `
      ${showRemoteVideo ? `
        <button class="audio-call-mini-video" type="button" data-call-mini-video data-call-restore aria-label="Drag receiver video or tap to return to active video call">
          <video data-call-remote-video autoplay muted playsinline></video>
          <span class="audio-call-mini-video-waiting" data-call-video-waiting${call.remoteVideoPaused ? "" : " hidden"}>
            <i class="fa-solid fa-video-slash"></i>
          </span>
        </button>
      ` : ""}
      <button class="audio-call-minimized-main" type="button" data-call-restore aria-label="Return to active audio call">
        ${renderCallPhoto(call, "audio-call-mini-photo")}
        <span>
          <strong>${escapeHtml(call.otherName)}</strong>
          <small>${onCall ? `ON CALL <b data-call-duration>${formatCallDuration(call)}</b>` : escapeHtml(status)}</small>
        </span>
      </button>
      <button class="audio-call-mini-action" type="button" data-call-mute aria-label="${call.muted ? "Unmute" : "Mute"} microphone">
        <i class="fa-solid fa-microphone${call.muted ? "-slash" : ""}"></i>
      </button>
      <button class="audio-call-mini-action end" type="button" data-call-end aria-label="End audio call">
        <i class="fa-solid fa-phone-slash"></i>
      </button>
    `;
    bindCallPanelActions(panel);
    syncCallMedia(call);
    return;
  }
  panel.innerHTML = `
      ${showRemoteVideo ? `
        <video class="audio-call-remote-video" data-call-remote-video autoplay muted playsinline></video>
        <div class="audio-call-video-waiting" data-call-video-waiting${call.remoteVideoPaused ? "" : " hidden"}>
          <i class="fa-solid fa-video-slash"></i>
          <span>Waiting for video...</span>
        </div>
      ` : ""}
      <div class="audio-call-overlay-head">
        <span class="audio-call-secure"><i class="fa-solid fa-lock"></i> KAILA CALL</span>
        <button class="audio-call-minimize" type="button" data-call-minimize aria-label="Minimize audio call">
          <i class="fa-solid fa-window-minimize"></i>
        </button>
      </div>
      <div class="audio-call-stage">
        ${showRemoteVideo ? "" : renderCallPhoto(call, "audio-call-avatar")}
        <div class="audio-call-state"><span class="audio-call-live-dot"></span> ${incoming ? "INCOMING CALL" : call.status === "ringing" ? "CALLING" : call.status === "connecting" ? "CONNECTING" : "ON CALL"}</div>
        <h2>${escapeHtml(call.otherName)}</h2>
        <p>${status}</p>
        ${onCall ? `<strong class="audio-call-duration" data-call-duration>${formatCallDuration(call)}</strong>` : ""}
      </div>
      ${call.localVideoEnabled ? `<video class="audio-call-local-video" data-call-local-video autoplay muted playsinline></video>` : ""}
      <div class="audio-call-overlay-actions">
        ${incoming ? `
          <button class="audio-call-control answer" type="button" data-call-accept>
            <span><i class="fa-solid fa-phone"></i></span>
            <b>Answer</b>
          </button>
          <button class="audio-call-control end" type="button" data-call-decline>
            <span><i class="fa-solid fa-phone-slash"></i></span>
            <b>Decline</b>
          </button>
        ` : `
          ${call.localStream ? `
            <button class="audio-call-control" type="button" data-call-mute>
              <span><i class="fa-solid fa-microphone${call.muted ? "-slash" : ""}"></i></span>
              <b>${call.muted ? "Unmute" : "Mute"}</b>
            </button>
            <button class="audio-call-control" type="button" data-call-video>
              <span><i class="fa-solid fa-video${call.localVideoEnabled ? "-slash" : ""}"></i></span>
              <b>${call.localVideoEnabled ? "Audio only" : "Start video"}</b>
            </button>
            ${call.localVideoEnabled && call.availableVideoInputs > 1 ? `
              <button class="audio-call-control" type="button" data-call-switch-camera>
                <span><i class="fa-solid fa-camera-rotate"></i></span>
                <b>Flip camera</b>
              </button>
            ` : ""}
          ` : ""}
          <button class="audio-call-control end" type="button" data-call-end>
            <span><i class="fa-solid fa-phone-slash"></i></span>
            <b>${onCall ? "End" : "Cancel"}</b>
          </button>
        `}
      </div>
    `;
  bindCallPanelActions(panel);
  syncCallMedia(call);
}

function bindCallPanelActions(panel) {
  $("[data-call-accept]", panel)?.addEventListener("click", acceptAudioCall);
  $("[data-call-decline]", panel)?.addEventListener("click", declineAudioCall);
  $("[data-call-mute]", panel)?.addEventListener("click", toggleAudioMute);
  $("[data-call-video]", panel)?.addEventListener("click", toggleCallVideo);
  $("[data-call-switch-camera]", panel)?.addEventListener("click", switchCallCamera);
  $("[data-call-end]", panel)?.addEventListener("click", () => endAudioCall(true));
  $("[data-call-minimize]", panel)?.addEventListener("click", () => setCallMinimized(true));
  const miniVideo = $("[data-call-mini-video]", panel);
  if (miniVideo) bindDraggableMiniVideo(miniVideo);
  $$("[data-call-restore]", panel).forEach((button) => button.addEventListener("click", () => {
    if (button === miniVideo && miniVideo.dataset.preventRestore) {
      delete miniVideo.dataset.preventRestore;
      return;
    }
    setCallMinimized(false);
  }));
}

function bindDraggableMiniVideo(tile) {
  const call = state.call;
  if (!call) return;
  applyMiniVideoPosition(tile, call.miniVideoPosition);
  tile.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = tile.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    let dragged = false;
    tile.setPointerCapture?.(event.pointerId);
    const move = (moveEvent) => {
      const left = start.left + moveEvent.clientX - start.x;
      const top = start.top + moveEvent.clientY - start.y;
      if (Math.abs(moveEvent.clientX - start.x) > 5 || Math.abs(moveEvent.clientY - start.y) > 5) dragged = true;
      call.miniVideoPosition = applyMiniVideoPosition(tile, { left, top });
    };
    const stop = () => {
      tile.removeEventListener("pointermove", move);
      tile.removeEventListener("pointerup", stop);
      tile.removeEventListener("pointercancel", stop);
      if (dragged) tile.dataset.preventRestore = "true";
    };
    tile.addEventListener("pointermove", move);
    tile.addEventListener("pointerup", stop);
    tile.addEventListener("pointercancel", stop);
  });
}

function applyMiniVideoPosition(tile, position) {
  if (!position) return null;
  const margin = 8;
  const maxLeft = Math.max(margin, window.innerWidth - tile.offsetWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - tile.offsetHeight - margin);
  const next = {
    left: Math.min(maxLeft, Math.max(margin, position.left)),
    top: Math.min(maxTop, Math.max(margin, position.top)),
  };
  tile.style.left = `${next.left}px`;
  tile.style.top = `${next.top}px`;
  tile.style.right = "auto";
  tile.style.bottom = "auto";
  return next;
}

window.addEventListener("resize", () => {
  const tile = $("[data-call-mini-video]");
  if (!tile || !state.call?.miniVideoPosition) return;
  state.call.miniVideoPosition = applyMiniVideoPosition(tile, state.call.miniVideoPosition);
});

function setCallMinimized(minimized) {
  if (!state.call) return;
  state.call.minimized = minimized;
  renderCallPanel();
}

function callInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function renderCallPhoto(call, className) {
  const photoUrl = resolveMediaUrl(call.otherPhotoUrl);
  return `<img class="${className}" src="${escapeAttribute(photoUrl)}" alt="${escapeAttribute(call.otherName)} photo">`;
}

function formatCallDuration(call) {
  const seconds = Math.max(0, Math.floor((Date.now() - (call.connectedAt || Date.now())) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function startCallClock() {
  clearInterval(callClockTimer);
  callClockTimer = setInterval(() => {
    if (!state.call?.connectedAt) return;
    $$("[data-call-duration]").forEach((host) => {
      host.textContent = formatCallDuration(state.call);
    });
  }, 1000);
}

async function acceptAudioCall() {
  const call = state.call;
  if (!call || call.status !== "incoming") return;
  try {
    stopCallTone();
    call.status = "connecting";
    renderCallPanel();
    call.localStream = await acquireCallMedia(call.requestedVideo);
    call.localVideoEnabled = Boolean(call.localStream.getVideoTracks().length);
    await refreshCallCameraAvailability(call);
    renderCallPanel();
    call.peerConnection = createPeerConnection(call);
    call.localStream.getTracks().forEach((track) => {
      const sender = call.peerConnection.addTrack(track, call.localStream);
      if (track.kind === "video") {
        call.videoSender = sender;
        monitorLocalVideoTrack(call, track);
      }
    });
    await call.peerConnection.setRemoteDescription(call.remoteDescription);
    await flushPendingCandidates(call);
    const answer = await call.peerConnection.createAnswer();
    await call.peerConnection.setLocalDescription(answer);
    emitCallSignal("answer", { description: call.peerConnection.localDescription });
  } catch (error) {
    emitCallSignal("reject");
    endAudioCall(false);
    notify("Call failed", microphoneErrorText(error), "error");
  }
}

function declineAudioCall() {
  if (!state.call) return;
  emitCallSignal("reject");
  endAudioCall(false);
}

function toggleAudioMute() {
  if (!state.call?.localStream) return;
  state.call.muted = !state.call.muted;
  state.call.localStream.getAudioTracks().forEach((track) => {
    track.enabled = !state.call.muted;
  });
  renderCallPanel();
}

async function toggleCallVideo() {
  if (!state.call?.peerConnection || !state.call.localStream) return;
  if (state.call.localVideoEnabled) {
    await disableCallVideo();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(callMediaConstraints(true, state.call.cameraFacingMode));
    const track = stream.getVideoTracks()[0];
    stream.getAudioTracks().forEach((item) => item.stop());
    if (!track) throw new Error("Camera is unavailable.");
    state.call.localStream.addTrack(track);
    if (state.call.videoSender) await state.call.videoSender.replaceTrack(track);
    else state.call.videoSender = state.call.peerConnection.addTrack(track, state.call.localStream);
    monitorLocalVideoTrack(state.call, track);
    state.call.localVideoEnabled = true;
    state.call.requestedVideo = true;
    state.call.qualityBadSamples = 0;
    state.call.qualityWarningShown = false;
    state.call.lastVideoStats = null;
    await refreshCallCameraAvailability(state.call);
    await renegotiateCall();
    renderCallPanel();
  } catch (error) {
    notify("Video unavailable", cameraErrorText(error), "warning");
  }
}

async function acquireCameraTrack(facingMode) {
  const baseVideo = callMediaConstraints(true, facingMode).video;
  const attempts = [
    { ...baseVideo, facingMode: { exact: facingMode } },
    { ...baseVideo, facingMode: { ideal: facingMode } },
    true,
  ];
  let lastError = null;
  for (const video of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error("Camera is unavailable.");
      stream.getVideoTracks().filter((item) => item !== track).forEach((item) => item.stop());
      return track;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Camera is unavailable.");
}

function monitorLocalVideoTrack(call, track) {
  if (!call || !track || track.kind !== "video") return;
  track.addEventListener("ended", () => scheduleLocalVideoRecovery(call, track));
  track.addEventListener("mute", () => scheduleLocalVideoRecovery(call, track));
  track.addEventListener("unmute", () => clearTimeout(call.cameraRecoveryTimer));
}

function scheduleLocalVideoRecovery(call, track, force = false) {
  if (!state.call || state.call.callId !== call.callId || !call.localVideoEnabled || call.cameraRecoverySuppressed || call.recoveringLocalVideo) return;
  if (!force && !call.localStream?.getTracks().includes(track) && call.videoSender?.track !== track) return;
  clearTimeout(call.cameraRecoveryTimer);
  call.cameraRecoveryTimer = setTimeout(() => recoverLocalVideoTrack(call, track, force), force ? 400 : 2500);
}

async function recoverLocalVideoTrack(call, failedTrack, force = false) {
  if (!state.call || state.call.callId !== call.callId || !call.localVideoEnabled || call.cameraRecoverySuppressed || call.recoveringLocalVideo) return;
  if (!force && failedTrack.readyState !== "ended" && !failedTrack.muted) return;
  if (force && Date.now() - call.lastCameraRecoveryAt < 10000) return;
  call.recoveringLocalVideo = true;
  call.lastCameraRecoveryAt = Date.now();
  try {
    const track = await acquireCameraTrack(call.cameraFacingMode);
    await call.videoSender?.replaceTrack(track);
    if (call.localStream.getTracks().includes(failedTrack)) call.localStream.removeTrack(failedTrack);
    if (failedTrack.readyState !== "ended") failedTrack.stop();
    call.localStream.addTrack(track);
    call.cameraFacingMode = track.getSettings().facingMode || call.cameraFacingMode;
    monitorLocalVideoTrack(call, track);
    call.qualityBadSamples = 0;
    call.cameraStallSamples = 0;
    call.lastVideoStats = null;
    renderCallPanel();
  } catch (error) {
    notify("Camera recovery failed", cameraErrorText(error), "warning");
  } finally {
    call.recoveringLocalVideo = false;
  }
}

async function switchCallCamera() {
  const call = state.call;
  if (!call?.localVideoEnabled || !call.videoSender || !call.localStream || call.availableVideoInputs < 2) return;
  const previousFacingMode = call.cameraFacingMode;
  const facingMode = call.cameraFacingMode === "environment" ? "user" : "environment";
  const oldTrack = call.localStream.getVideoTracks()[0];
  try {
    call.cameraRecoverySuppressed = true;
    if (oldTrack) {
      call.localStream.removeTrack(oldTrack);
      oldTrack.stop();
    }
    await call.videoSender.replaceTrack(null);
    const track = await acquireCameraTrack(facingMode);
    await call.videoSender.replaceTrack(track);
    call.localStream.addTrack(track);
    call.cameraFacingMode = track.getSettings().facingMode || facingMode;
    monitorLocalVideoTrack(call, track);
    call.qualityBadSamples = 0;
    call.lastVideoStats = null;
    await refreshCallCameraAvailability(call);
    renderCallPanel();
  } catch (error) {
    try {
      const fallbackTrack = await acquireCameraTrack(previousFacingMode);
      await call.videoSender.replaceTrack(fallbackTrack);
      call.localStream.addTrack(fallbackTrack);
      call.cameraFacingMode = fallbackTrack.getSettings().facingMode || previousFacingMode;
      monitorLocalVideoTrack(call, fallbackTrack);
    } catch {
      call.localVideoEnabled = false;
      call.requestedVideo = false;
      await renegotiateCall().catch(() => {});
    }
    call.qualityBadSamples = 0;
    call.lastVideoStats = null;
    notify("Camera switch unavailable", cameraErrorText(error), "warning");
    renderCallPanel();
  } finally {
    call.cameraRecoverySuppressed = false;
  }
}

async function disableCallVideo({ automatic = false } = {}) {
  const call = state.call;
  if (!call?.peerConnection || !call.localStream) return;
  call.cameraRecoverySuppressed = true;
  clearTimeout(call.cameraRecoveryTimer);
  clearTimeout(call.remoteRecoveryTimer);
  try {
    const videoTracks = call.localStream.getVideoTracks();
    for (const track of videoTracks) {
      const sender = call.peerConnection.getSenders().find((item) => item.track === track);
      if (sender) {
        call.videoSender = sender;
        await sender.replaceTrack(null);
      }
      call.localStream.removeTrack(track);
      track.stop();
    }
    call.localVideoEnabled = false;
    call.requestedVideo = false;
    call.qualityBadSamples = 0;
    call.qualityWarningShown = false;
    call.lastVideoStats = null;
    await renegotiateCall();
    renderCallPanel();
    if (automatic) notify("Switched to audio only", "Video was paused because the connection is slow.", "warning");
  } finally {
    call.cameraRecoverySuppressed = false;
  }
}

async function renegotiateCall() {
  const call = state.call;
  if (!call?.peerConnection) return;
  const offer = await call.peerConnection.createOffer();
  await call.peerConnection.setLocalDescription(offer);
  emitCallSignal("renegotiate", { description: call.peerConnection.localDescription, withVideo: call.localVideoEnabled });
}

function endAudioCall(notifyOther = true) {
  if (!state.call) return;
  if (notifyOther) emitCallSignal("hangup");
  clearTimeout(state.call.ringingTimer);
  clearTimeout(state.call.cameraRecoveryTimer);
  clearTimeout(state.call.remoteRecoveryTimer);
  stopCallTone();
  state.call.localStream?.getTracks().forEach((track) => track.stop());
  state.call.peerConnection?.close();
  state.call = null;
  clearInterval(callClockTimer);
  callClockTimer = null;
  stopCallQualityMonitor();
  renderCallPanel();
}

function emitCallSignal(type, extra = {}) {
  if (!state.call || !state.socket) return;
  state.socket.emit("kaila.call.signal", {
    requestId: state.call.requestId,
    callId: state.call.callId,
    type,
    ...extra,
  }, (response = {}) => {
    if (response.ok || !state.call) return;
    endAudioCall(false);
    notify("Audio call", response.code === "recipient_offline" ? "The other party is offline." : response.error || "Could not reach the other party.", response.code === "recipient_offline" ? "info" : "error");
  });
}

async function handleCallSignal(signal = {}) {
  if (!state.session) return;
  if (signal.type === "answered-elsewhere") {
    if (state.call?.callId === signal.callId && state.call.status === "incoming") {
      endAudioCall(false);
      notify("Call answered", "This call was answered on another signed-in device.", "info");
    }
    return;
  }
  if (signal.senderId === state.session.id) return;
  if (signal.type === "offer") {
    if (!callSupported()) {
      state.socket?.emit("kaila.call.signal", { requestId: signal.requestId, callId: signal.callId, type: "reject" });
      notify("Audio call unavailable", audioCallUnavailableMessage(), "warning");
      return;
    }
    if (state.call) {
      state.socket?.emit("kaila.call.signal", { requestId: signal.requestId, callId: signal.callId, type: "busy" });
      return;
    }
    const request = state.requests.find((item) => item.id === signal.requestId);
    state.call = createCallState(signal.requestId, signal.callId, "incoming", signal.senderName, userProfile(signal.senderId).photoUrl || conversationOtherPartyPhoto(request), Boolean(signal.withVideo));
    state.call.remoteDescription = signal.description;
    scheduleCallTimeout(state.call);
    renderCallPanel();
    startCallTone("incoming");
    notifyIncomingCall(signal.senderName, state.call.requestedVideo);
    return;
  }
  if (!state.call || signal.callId !== state.call.callId) return;
  if (signal.type === "answer") {
    stopCallTone();
    await state.call.peerConnection?.setRemoteDescription(signal.description);
    await flushPendingCandidates(state.call);
  } else if (signal.type === "renegotiate") {
    state.call.requestedVideo = Boolean(signal.withVideo);
    state.call.remoteVideoExpected = Boolean(signal.withVideo);
    state.call.remoteVideoEnabled = Boolean(signal.withVideo);
    state.call.remoteVideoPaused = Boolean(signal.withVideo);
    await state.call.peerConnection?.setRemoteDescription(signal.description);
    const answer = await state.call.peerConnection?.createAnswer();
    if (answer) {
      await state.call.peerConnection.setLocalDescription(answer);
      emitCallSignal("answer", { description: state.call.peerConnection.localDescription });
    }
    renderCallPanel();
  } else if (signal.type === "candidate") {
    if (state.call.peerConnection?.remoteDescription) await state.call.peerConnection.addIceCandidate(signal.candidate);
    else state.call.pendingCandidates.push(signal.candidate);
  } else if (signal.type === "video-stalled") {
    const track = state.call.localStream?.getVideoTracks()[0];
    if (track) scheduleLocalVideoRecovery(state.call, track, true);
  } else if (["hangup", "reject", "busy", "offline"].includes(signal.type)) {
    const message = signal.type === "busy" ? "The other party is already on a call." : signal.type === "reject" ? "The other party declined the call." : signal.type === "offline" ? "The other party went offline." : "The audio call ended.";
    endAudioCall(false);
    notify("Audio call", message, ["busy", "offline"].includes(signal.type) ? "warning" : "info");
  }
}

function notifyIncomingCall(senderName, withVideo = false) {
  const callType = withVideo ? "video" : "audio";
  notify(`Incoming ${callType} call`, `${senderName || "Your job contact"} is calling.`, "info");
  navigator.vibrate?.([450, 180, 450, 180, 700]);
  if (document.hidden && window.Notification?.permission === "granted") {
    new Notification(`Incoming KAILA ${callType} call`, { body: `${senderName || "Your job contact"} is calling.` });
  }
}

function startCallTone(mode) {
  stopCallTone();
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const playBeep = (frequency, duration, delay = 0, type = "square", volume = 0.3) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };
  const playPattern = () => {
    if (mode === "incoming") {
      playBeep(820, 0.22);
      playBeep(1120, 0.22, 0.27, "sawtooth", 0.34);
      playBeep(820, 0.22, 0.54);
      playBeep(1120, 0.34, 0.81, "sawtooth", 0.34);
      navigator.vibrate?.([420, 100, 420, 100, 650]);
    } else {
      playBeep(520, 0.18, 0, "square", 0.22);
      playBeep(680, 0.18, 0.25, "square", 0.22);
    }
  };
  context.resume().then(playPattern).catch(() => {});
  callTone = { context, timer: setInterval(playPattern, mode === "incoming" ? 1450 : 1900) };
}

function stopCallTone() {
  if (!callTone) return;
  clearInterval(callTone.timer);
  callTone.context.close().catch(() => {});
  callTone = null;
  navigator.vibrate?.(0);
}

function scheduleCallTimeout(call) {
  call.ringingTimer = setTimeout(() => {
    if (!state.call || state.call.callId !== call.callId || state.call.status === "connected") return;
    emitCallSignal("hangup");
    endAudioCall(false);
    notify("Audio call", "No answer.", "info");
  }, 30000);
}

async function flushPendingCandidates(call) {
  while (call.pendingCandidates.length) await call.peerConnection.addIceCandidate(call.pendingCandidates.shift());
}

function microphoneErrorText(error) {
  return error?.name === "NotAllowedError"
    ? "Microphone permission is required for an audio call."
    : error?.message || "Could not start the audio call.";
}

function cameraErrorText(error) {
  return error?.name === "NotAllowedError"
    ? "Camera permission is required to enable video."
    : error?.message || "Could not enable the camera.";
}

function startCallQualityMonitor(call) {
  stopCallQualityMonitor();
  callQualityTimer = setInterval(() => checkCallVideoQuality(call), 5000);
}

function stopCallQualityMonitor() {
  clearInterval(callQualityTimer);
  callQualityTimer = null;
}

async function checkCallVideoQuality(call) {
  if (!state.call || state.call.callId !== call.callId || !call.localVideoEnabled || !call.peerConnection) return;
  try {
    const stats = await call.peerConnection.getStats();
    let outbound = null;
    let pair = null;
    let remoteInbound = null;
    stats.forEach((report) => {
      if (report.type === "outbound-rtp" && report.kind === "video" && !report.isRemote) outbound = report;
      if (report.type === "candidate-pair" && report.state === "succeeded" && (report.nominated || !pair)) pair = report;
      if (report.type === "remote-inbound-rtp" && report.kind === "video") remoteInbound = report;
    });
    if (!outbound) return;
    const previous = call.lastVideoStats;
    const current = {
      framesEncoded: outbound.framesEncoded,
    };
    call.lastVideoStats = current;
    const stalled = previous
      && Number.isFinite(previous.framesEncoded)
      && Number.isFinite(current.framesEncoded)
      && current.framesEncoded <= previous.framesEncoded;
    call.cameraStallSamples = stalled ? call.cameraStallSamples + 1 : 0;
    if (call.cameraStallSamples >= 3) {
      const track = call.localStream?.getVideoTracks()[0];
      if (track) scheduleLocalVideoRecovery(call, track, true);
      call.cameraStallSamples = 0;
    }
    const severeSignals = [
      Number.isFinite(pair?.currentRoundTripTime) && pair.currentRoundTripTime > 4,
      Number.isFinite(pair?.availableOutgoingBitrate) && pair.availableOutgoingBitrate < 20000,
      Number.isFinite(remoteInbound?.fractionLost) && remoteInbound.fractionLost > 0.6,
    ].filter(Boolean).length;
    const slow = stalled && severeSignals >= 2;
    call.qualityBadSamples = slow ? call.qualityBadSamples + 1 : Math.max(0, call.qualityBadSamples - 1);
    if (call.qualityBadSamples >= 12 && !call.qualityWarningShown) {
      call.qualityWarningShown = true;
      notify("Weak video connection", "Video quality may be reduced. The call will remain on video unless you switch to audio only.", "warning");
    }
  } catch {}
}

function conversationOtherPartyName(request) {
  if (request.clientId === state.session?.id) return userProfile(request.acceptedProviderId).name || "Provider";
  return request.clientName || "Client";
}

function conversationOtherPartyPhoto(request = {}) {
  if (request.clientId === state.session?.id) return request.acceptedProviderPhotoUrl || userProfile(request.acceptedProviderId).photoUrl || "";
  return request.clientPhotoUrl || userProfile(request.clientId).photoUrl || "";
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
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    window.Swal?.showValidationMessage?.("Profile photo must be JPG, PNG, or WebP.");
    throw new Error("Profile photo must be JPG, PNG, or WebP.");
  }
  try {
    return await compressProfilePhoto(file);
  } catch (error) {
    window.Swal?.showValidationMessage?.(error.message);
    throw error;
  }
}

async function compressProfilePhoto(file) {
  const image = await loadImageFile(file);
  const maxSize = 512;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  if (dataUrl.length > Math.ceil((2 * 1024 * 1024 * 4) / 3)) throw new Error("Profile photo must be 2 MB or smaller.");
  return { name: file.name.replace(/\.[^.]+$/, ".jpg"), dataUrl };
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not prepare this profile photo. Try a JPG, PNG, or WebP image."));
    };
    image.src = url;
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
    area: state.session.role === "admin" ? state.session.area || "" : addressValue("settings-address"),
    category: state.session.role === "provider" ? selectedCategoryChips("settings-category") : [],
    contactNumber: form.elements.contactNumber.value.trim(),
    messengerLink: form.elements.messengerLink.value.trim(),
    preferredContactChannel: $("#settings-contact-channel")?.value || "",
    bestContactTime: form.elements.bestContactTime.value.trim(),
    dataPrivacyConsent: form.elements.dataPrivacyConsent?.checked,
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

async function openAdminCreateAccountModal() {
  const result = await modal({
    title: "Create account",
    html: `
      <div class="swal-form two">
        <label><span>Role</span>${select("admin-account-role", ["client", "provider", "ops"], "client")}</label>
        <label><span>Full name</span><input id="admin-account-name" class="form-control" autocomplete="name"></label>
        <label><span>Username</span><input id="admin-account-username" class="form-control" autocomplete="username"></label>
        <label><span>Contact number</span><input id="admin-account-contact" class="form-control"></label>
        <label><span>Messenger / Facebook</span><input id="admin-account-messenger" class="form-control"></label>
        <label><span>Preferred contact</span>${select("admin-account-channel", ["Messenger", "SMS", "Call", "Email", "Other"], "Messenger")}</label>
        <label><span>Best contact time</span><input id="admin-account-best-time" class="form-control"></label>
        <label>
          <span>Password</span>
          <div class="password-field">
            <input id="admin-account-password" class="form-control" type="password" autocomplete="new-password">
            <button class="password-toggle" type="button" data-password-toggle aria-label="Show password">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </label>
        <label class="wide" data-admin-account-address><span>Address</span>${addressFields("admin-account-address", state.session.area || "")}</label>
        <div class="wide" data-admin-provider-fields hidden>
          <label><span>Display name</span><input id="admin-provider-display" class="form-control"></label>
          <label><span>Provider type</span>${select("admin-provider-type", ["Individual", "Freelancer", "Shop", "Small team", "Business"], "Individual")}</label>
          <label><span>Service categories</span>${categoryChips("admin-account-category", "")}</label>
          <label><span>Specific services</span><textarea id="admin-provider-services" class="form-control" rows="2"></textarea></label>
          <label><span>Experience</span>${select("admin-provider-experience", ["Less than 1", "1-2", "3-5", "6-10", "10+"], "1-2")}</label>
          <label><span>Coverage area</span><textarea id="admin-provider-coverage" class="form-control" rows="2"></textarea></label>
          <label><span>Emergency availability</span>${select("admin-provider-emergency", ["Yes", "No", "Sometimes"], "Sometimes")}</label>
          <label><span>Available days</span><input id="admin-provider-days" class="form-control"></label>
          <label><span>Available time</span><input id="admin-provider-time" class="form-control"></label>
          <label><span>Travel limits</span><input id="admin-provider-travel" class="form-control"></label>
          <label><span>Minimum fee</span><input id="admin-provider-min-fee" class="form-control"></label>
          <label><span>Price range</span><input id="admin-provider-price-range" class="form-control"></label>
          <label><span>Work samples</span><input id="admin-provider-work-samples" class="form-control"></label>
          <label><span>Certificate / permit</span><input id="admin-provider-certificate" class="form-control"></label>
          <label class="consent-line"><input id="admin-provider-valid-id" type="checkbox"> Optional ID may be used for verification.</label>
          <label class="consent-line"><input id="admin-provider-requests" type="checkbox" checked> Provider agrees to receive pilot requests.</label>
          <label class="consent-line"><input id="admin-provider-ratings" type="checkbox" checked> Provider agrees to receive ratings.</label>
          <label class="consent-line"><input id="admin-provider-rules" type="checkbox" checked> Provider agrees to rules.</label>
        </div>
        <label class="wide consent-line"><input id="admin-account-privacy" type="checkbox" checked> Data privacy consent recorded.</label>
      </div>
    `,
    confirmButtonText: "Create Account",
    didOpen: () => {
      bindAddressGroup("admin-account-address");
      bindCategoryChips("admin-account-category");
      $$("[data-password-toggle]", window.Swal.getPopup()).forEach((button) => button.addEventListener("click", togglePasswordVisibility));
      $("#admin-account-role")?.addEventListener("change", syncAdminAccountFields);
      syncAdminAccountFields();
    },
    preConfirm: () => {
      const role = $("#admin-account-role").value;
      const payload = {
        role,
        name: $("#admin-account-name").value.trim(),
        username: $("#admin-account-username").value.trim(),
        password: $("#admin-account-password").value,
        contactNumber: $("#admin-account-contact").value.trim(),
        messengerLink: $("#admin-account-messenger").value.trim(),
        preferredContactChannel: $("#admin-account-channel").value,
        bestContactTime: $("#admin-account-best-time").value.trim(),
        dataPrivacyConsent: $("#admin-account-privacy").checked,
        area: role === "ops" ? "Operations" : addressValue("admin-account-address"),
        category: role === "provider" ? selectedCategoryChips("admin-account-category") : [],
        displayName: $("#admin-provider-display")?.value.trim() || "",
        providerType: $("#admin-provider-type")?.value || "",
        specificServices: $("#admin-provider-services")?.value.trim() || "",
        yearsExperience: $("#admin-provider-experience")?.value || "",
        coverageArea: $("#admin-provider-coverage")?.value.trim() || "",
        emergencyAvailability: $("#admin-provider-emergency")?.value || "",
        availableDays: $("#admin-provider-days")?.value.trim() || "",
        availableTime: $("#admin-provider-time")?.value.trim() || "",
        travelLimits: $("#admin-provider-travel")?.value.trim() || "",
        minimumFee: $("#admin-provider-min-fee")?.value.trim() || "",
        priceRange: $("#admin-provider-price-range")?.value.trim() || "",
        workSamples: $("#admin-provider-work-samples")?.value.trim() || "",
        certificateProof: $("#admin-provider-certificate")?.value.trim() || "",
        validIdConsent: $("#admin-provider-valid-id")?.checked || false,
        consentRequests: $("#admin-provider-requests")?.checked || false,
        consentRatings: $("#admin-provider-ratings")?.checked || false,
        rulesAgreement: $("#admin-provider-rules")?.checked || false,
      };
      if (!payload.name || !payload.username || !payload.password || !payload.contactNumber || !payload.preferredContactChannel || !payload.dataPrivacyConsent) {
        window.Swal.showValidationMessage("Name, username, password, contact number, preferred contact, and consent are required.");
        return false;
      }
      if (payload.password.length < 6) {
        window.Swal.showValidationMessage("Password must be at least 6 characters.");
        return false;
      }
      if (role !== "ops" && !payload.area) {
        window.Swal.showValidationMessage("Address is required.");
        return false;
      }
      if (role === "provider" && (!payload.category.length || !payload.specificServices || !payload.coverageArea || !payload.consentRequests || !payload.consentRatings || !payload.rulesAgreement)) {
        window.Swal.showValidationMessage("Provider category, services, coverage, request consent, rating consent, and rules agreement are required.");
        return false;
      }
      return payload;
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify(result.value) });
    applyServerState(payload.state);
    notify("Account created", `${payload.user.name} can now log in.`, "success");
  } catch (error) {
    notify("Account failed", error.message, "error");
  }
}

function syncAdminAccountFields() {
  const role = $("#admin-account-role")?.value || "client";
  const address = $("[data-admin-account-address]");
  const providerFields = $("[data-admin-provider-fields]");
  if (address) address.hidden = role === "ops";
  if (providerFields) providerFields.hidden = role !== "provider";
}

function connectSocket(force = false) {
  const urlInput = $("[data-socket-url]");
  const savedUrl = localStorage.getItem(STORAGE.socketUrl) || "";
  const socketUrl = normalizeSocketUrl(urlInput.value.trim()) || normalizeSocketUrl(savedUrl) || defaultSocketUrl();
  urlInput.value = socketUrl;
  localStorage.setItem(STORAGE.socketUrl, socketUrl);
  if (force && state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  if (state.socket) return;
  loadSocketClient(socketUrl).then(() => {
    state.socket = window.io(socketIoOrigin(socketUrl), { path: socketIoPath(socketUrl) });
    state.socket.on("connect", () => {
      state.connected = true;
      $("[data-socket-dot]").classList.add("connected");
      state.socket.emit("subscribe", CHANNEL);
      syncSocketIdentity();
    });
    state.socket.on("disconnect", () => {
      state.connected = false;
      $("[data-socket-dot]").classList.remove("connected");
      if (state.call) {
        endAudioCall(false);
        notify("Audio call", "The live connection was lost.", "warning");
      }
    });
    state.socket.on("kaila.state.updated", applyServerState);
    state.socket.on("kaila.request.created", handleRequestCreated);
    state.socket.on("kaila.provider.saved", handleProviderSaved);
    state.socket.on("kaila.offer.saved", handleOfferSaved);
    state.socket.on("kaila.request.confirmed", handleRequestConfirmed);
    state.socket.on("kaila.request.passed", handleRequestPassed);
    state.socket.on("kaila.request.action", handleRequestAction);
    state.socket.on("kaila.message.saved", handleMessageSaved);
    state.socket.on("kaila.typing.changed", handleTypingChanged);
    state.socket.on("kaila.message.reaction", ({ requestId }) => refreshConversation(requestId));
    state.socket.on("kaila.presence.changed", ({ requestId }) => updateConversationPresence(requestId));
    state.socket.on("kaila.call.signal", (signal) => handleCallSignal(signal).catch((error) => {
      endAudioCall(false);
      notify("Call failed", error.message || "Audio call signaling failed.", "error");
    }));
    state.socket.on("kaila.activity", (activity) => {
      if (!state.activity.some((item) => item.id === activity.id)) state.activity.unshift(activity);
      renderActivity();
    });
  }).catch(() => addActivity("Socket offline", "Start kaila/socket."));
}

function syncSocketIdentity() {
  state.socket?.emit("identify", state.session?.id || "");
}

function handleRequestCreated({ request } = {}) {
  loadState();
  if (!request || !state.session || request.clientId === state.session.id) return;
  if (state.session.role !== "provider") return;
  if (state.session.role === "provider" && !providerMatchesRequest(request)) return;
  const client = userProfile(request.clientId);
  announceAttentionEvent("New job request", `${request.category} in ${request.area}`, "request");

  queueAttentionModal({
    customClass: { popup: "kaila-popup attention-request-popup" },
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
      <div class="attention-request">
        ${renderAttentionProfile(request.clientName, request.clientPhotoUrl || client.photoUrl, "Client reputation", request.clientReputation || client.reputation)}
        <div class="attention-request-details">
          <strong>${escapeHtml(request.category)}</strong>
          <p>${escapeHtml(request.details)}</p>
          <span>${escapeHtml(request.area)} - ${escapeHtml(request.urgency)} - ${escapeHtml(formatCurrency(request.budget))}</span>
        </div>
      </div>
    `,
  });
}

function renderAttentionProfile(name, photoUrl, reputationLabel, reputation) {
  return `
    <div class="attention-profile">
      <img class="attention-profile-photo" src="${escapeAttribute(resolveMediaUrl(photoUrl))}" alt="${escapeAttribute(name)} photo">
      <strong>${escapeHtml(name)}</strong>
      ${renderReputationBadge(reputationLabel, reputation)}
    </div>
  `;
}

async function handleOfferSaved({ requestId, offer } = {}) {
  await loadState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !offer || !state.session || offer.providerId === state.session.id) return;
  if (request.clientId !== state.session.id) return;
  const offers = visibleOffers(request);
  if (!offers.some((item) => item.providerId === offer.providerId)) return;

  const isCounter = offer.type === "counter";
  const enrichedOffer = offers.find((item) => item.providerId === offer.providerId) || offer;
  const provider = userProfile(offer.providerId);
  announceAttentionEvent(isCounter ? "New counter-offer" : "New offer received", `${offer.providerName} sent ${formatCurrency(offer.amount)} for ${request.category}`, "offer");
  if (offers.length > 1) {
    if (updateActiveOfferPrompt(request, isCounter)) return;
    queueAttentionModal(compactOfferAttentionOptions(request, isCounter));
    return;
  }
  queueAttentionModal({
    customClass: { popup: "kaila-popup attention-request-popup" },
    title: isCounter ? "New counter-offer" : "New offer received",
    confirmButtonText: "View request",
    onConfirm: () => focusRequestCard(request.id),
    didOpen: () => {
      state.activeOfferPromptRequestId = request.id;
    },
    willClose: () => {
      if (state.activeOfferPromptRequestId === request.id) state.activeOfferPromptRequestId = null;
    },
    html: `
      <div class="attention-request">
        ${renderAttentionProfile(offer.providerName, enrichedOffer.providerPhotoUrl || provider.photoUrl, "Provider reputation", offerProviderReputation(enrichedOffer))}
        <div class="attention-request-details">
          <strong>${escapeHtml(formatCurrency(offer.amount))} for ${escapeHtml(request.category)}</strong>
          <p>${escapeHtml(offer.schedule || "Schedule TBD")}</p>
          ${offer.notes ? `<span>${escapeHtml(offer.notes)}</span>` : ""}
        </div>
      </div>
    `,
  });
}

async function handleRequestPassed({ requestId } = {}) {
  await loadState();
  if (!requestId || state.activeOfferPromptRequestId !== requestId || !window.Swal.isVisible()) return;
  const request = state.requests.find((item) => item.id === requestId);
  const offers = visibleOffers(request);
  if (offers.length) {
    updateActiveOfferPrompt(request);
    return;
  }
  window.Swal.close();
}

function compactOfferAttentionOptions(request, isCounter = false) {
  return {
    customClass: { popup: "kaila-popup attention-request-popup compact-offers-popup" },
    title: isCounter ? "Counter-offers updated" : "Offers received",
    confirmButtonText: "View request",
    onConfirm: () => focusRequestCard(request.id),
    didOpen: () => {
      state.activeOfferPromptRequestId = request.id;
      bindCompactOfferButtons(request.id);
    },
    willClose: () => {
      if (state.activeOfferPromptRequestId === request.id) state.activeOfferPromptRequestId = null;
    },
    html: renderCompactOffersPrompt(request),
  };
}

function updateActiveOfferPrompt(request, isCounter = false) {
  if (!window.Swal.isVisible() || state.activeOfferPromptRequestId !== request.id) return false;
  document.querySelector(".swal2-popup")?.classList.add("attention-request-popup", "compact-offers-popup");
  window.Swal.update({
    title: isCounter ? "Counter-offers updated" : "Offers received",
    html: renderCompactOffersPrompt(request),
    confirmButtonText: "View request",
    showDenyButton: false,
    showCancelButton: false,
  });
  bindCompactOfferButtons(request.id);
  return true;
}

function bindCompactOfferButtons(requestId) {
  $$("[data-offer-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      window.Swal.close();
      openOfferDetailModal(requestId, button.dataset.offerDetail);
    });
  });
}

function renderCompactOffersPrompt(request) {
  const offers = visibleOffers(request);
  return `
    <div class="compact-offers">
      <div class="compact-offers-summary">
        <strong>${escapeHtml(offers.length)} offers for ${escapeHtml(request.category)}</strong>
        <span>${escapeHtml(request.area)} - ${escapeHtml(formatCurrency(request.budget))}</span>
      </div>
      <div class="compact-offer-photos" aria-label="Provider offers">
        ${offers.map((offer) => `
          <button class="compact-offer-photo" type="button" data-offer-detail="${escapeAttribute(offer.id)}" aria-label="View ${escapeAttribute(offer.providerName)} offer">
            <img src="${escapeAttribute(resolveMediaUrl(offer.providerPhotoUrl))}" alt="">
            <span>${escapeHtml(formatCurrency(offer.amount))}</span>
          </button>
        `).join("")}
      </div>
      <small>Tap a provider photo to inspect the offer.</small>
    </div>
  `;
}

async function openOfferDetailModal(requestId, offerId) {
  const request = state.requests.find((item) => item.id === requestId);
  const offer = visibleOffers(request).find((item) => item.id === offerId);
  if (!request || !offer) return;

  const result = await window.Swal.fire({
    customClass: { popup: "kaila-popup attention-request-popup" },
    title: "Offer details",
    html: `
      <div class="attention-request">
        ${renderAttentionProfile(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offerProviderReputation(offer))}
        <div class="attention-request-details">
          <strong>${escapeHtml(formatCurrency(offer.amount))} for ${escapeHtml(request.category)}</strong>
          <p>${escapeHtml(offer.schedule || "Schedule TBD")}</p>
          ${offer.notes ? `<span>${escapeHtml(offer.notes)}</span>` : ""}
        </div>
      </div>
    `,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Select Offer",
    denyButtonText: "Back to Offers",
    cancelButtonText: "View Request",
    reverseButtons: true,
    focusConfirm: false,
  });

  if (result.isConfirmed) {
    confirmRequest(requestId, offerId);
  } else if (result.isDenied) {
    queueAttentionModal(compactOfferAttentionOptions(request));
  } else if (result.dismiss === window.Swal.DismissReason.cancel) {
    focusRequestCard(requestId, offerId);
  }
}

function handleMessageSaved({ requestId, message } = {}) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !message || !state.session || message.senderId === state.session.id) return;
  if (!canViewConversation(request)) return;
  if (state.activeConversationId === requestId) {
    refreshConversation(requestId);
    return;
  }
  announceAttentionEvent("New job message", `${message.senderName}: ${message.detail}`, "message");

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

async function handleProviderSaved({ provider } = {}) {
  await loadState();
  if (!provider || !state.session || provider.userId === state.session.id || state.session.role !== "admin") return;
  announceAttentionEvent("Provider profile updated", `${provider.name || "A provider"} updated their service profile.`, "update");
}

async function handleRequestConfirmed({ requestId, actorId } = {}) {
  await loadState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !isRequestParty(request) || actorId === state.session?.id) return;
  announceAttentionEvent("Offer confirmed", `${request.category} is now confirmed. Messaging and audio calls are open.`, "confirmed");
}

async function handleRequestAction({ requestId, action, status, actorId } = {}) {
  await loadState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !isRequestParty(request) || actorId === state.session?.id) return;
  const titles = {
    start: "Job started",
    provider_complete: "Job marked done",
    client_complete: "Completion confirmed",
    rate: "New rating submitted",
    cancel: "Job cancelled",
    dispute: "Job disputed",
    request_revision: "Revision requested",
    auto_confirm: "Job auto-confirmed",
    rating_window_closed: "Rating window closed",
  };
  announceAttentionEvent(titles[action] || "Job updated", `${request.category}: ${status || request.status}`, ["dispute", "cancel", "request_revision"].includes(action) ? "urgent" : "update");
}

function isRequestParty(request = {}) {
  return Boolean(state.session && (request.clientId === state.session.id || request.acceptedProviderId === state.session.id));
}

function handleTypingChanged({ requestId, senderId, senderName, typing } = {}) {
  if (requestId !== state.activeConversationId || senderId === state.session?.id) return;
  const host = $("[data-chat-typing]");
  if (host) host.textContent = typing ? `${senderName} is typing...` : "";
}

function announceAttentionEvent(title, detail = "", kind = "update") {
  playAttentionTone(kind);
  navigator.vibrate?.(kind === "urgent" ? [500, 100, 500, 100, 700] : [280, 90, 280, 90, 420]);
  if (document.hidden && window.Notification?.permission === "granted") {
    new Notification(`KAILA: ${title}`, {
      body: detail,
      icon: "assets/android-chrome-192x192.png",
      tag: `kaila-${kind}`,
    });
  }
}

function playAttentionTone(kind = "update") {
  if (state.call || callTone) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  attentionTone?.close().catch(() => {});
  const context = new AudioContext();
  attentionTone = context;
  const urgent = kind === "urgent";
  const notes = urgent ? [980, 720, 980, 720] : [880, 1120, 880];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.18;
    oscillator.type = index % 2 ? "square" : "sawtooth";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.34 : 0.26, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
  });
  context.resume().catch(() => {});
  setTimeout(() => {
    if (attentionTone !== context) return;
    context.close().catch(() => {});
    attentionTone = null;
  }, notes.length * 180 + 180);
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
      if (onConfirm) onConfirm();
      else route("app");
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
  return window.location.protocol === "https:" ? `${protocol}//${host}/kaila-api` : `${protocol}//${host}:6002`;
}

function normalizeSocketUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname) && !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return "";
    if (window.location.protocol === "https:" && url.protocol !== "https:") return "";
    return value;
  } catch {
    return "";
  }
}

function socketIoOrigin(socketUrl) {
  return new URL(socketUrl).origin;
}

function socketIoPath(socketUrl) {
  const path = new URL(socketUrl).pathname.replace(/\/$/, "");
  return `${path}/socket.io`;
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
  return state.session?.role === "provider" && ["Posted", "Offers Received", "Countered"].includes(request.status);
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
  return state.session?.role === "client" && request.clientId === state.session.id && visibleOffers(request).length > 0 && ["Offers Received", "Countered"].includes(request.status);
}

function visibleOffers(request) {
  if (!request?.offers?.length) return [];
  const passedProviderIds = new Set(request.passedProviderIds || []);
  return request.offers.filter((offer) => !passedProviderIds.has(offer.providerId));
}

function canViewConversation(request) {
  if (!state.session || !request.acceptedProviderId) return false;
  return request.clientId === state.session.id || request.acceptedProviderId === state.session.id;
}

function jobActionButtons(request) {
  if (!state.session) return "";
  const buttons = [];
  const isClient = state.session.role === "client" && request.clientId === state.session.id;
  const isProvider = state.session.role === "provider" && request.acceptedProviderId === state.session.id;
  const add = (action, label, style = "outline-secondary") => {
    buttons.push(`<button class="btn btn-sm btn-${style}" data-request-id="${request.id}" data-job-action="${action}">${label}</button>`);
  };

  if (isProvider && request.status === "Accepted") add("start", "Start", "outline-primary");
  if (isProvider && ["Accepted", "In Progress", "Revision Requested"].includes(request.status)) add("provider_complete", "Job Done", "outline-success");
  if (isClient && request.status === "Provider Marked Done") add("client_complete", "Confirm Completion", "outline-success");
  if (isClient && request.status === "Provider Marked Done") add("request_revision", "Request Revision", "outline-warning");
  if (isClient && request.status === "Payment Released" && !request.clientRatedAt) add("rate", "Rate Provider", "outline-primary");
  if (isProvider && request.status === "Payment Released" && !request.providerRatedAt) add("rate", "Rate Client", "outline-primary");
  if (isClient && ["Posted", "Offers Received", "Countered", "Accepted"].includes(request.status)) add("cancel", "Cancel", "outline-danger");
  if ((isClient || isProvider) && ["Accepted", "In Progress", "Provider Marked Done", "Payment Released"].includes(request.status)) add("dispute", "Dispute", "outline-warning");
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

function categoryChips(id, selected = "") {
  const selectedItems = categoryList(selected);
  const availableItems = SERVICE_CATEGORIES.filter((category) => !selectedItems.includes(category));
  return `
    <div class="category-chip-box" data-category-chip-box="${escapeAttribute(id)}">
      <div class="category-chip-selected" data-category-selected>
        ${selectedItems.map((category) => categoryChip(category, true)).join("") || `<span class="category-chip-empty">Select categories below</span>`}
      </div>
      <div class="category-chip-options" data-category-options>
        ${availableItems.map((category) => categoryChip(category)).join("") || `<span class="category-chip-empty">All categories selected</span>`}
      </div>
    </div>
  `;
}

function categoryChip(category, selected = false) {
  return `<button class="category-chip ${selected ? "selected" : ""}" type="button" data-category-chip="${escapeAttribute(category)}">${escapeHtml(category)}</button>`;
}

function renderCategoryChips(id, selected = "") {
  const host = $(`[data-${id.replace(/-/g, "-")}], [data-register-category]`);
  if (host) {
    host.innerHTML = categoryChips(id, selected);
    bindCategoryChips(id);
  }
}

function bindCategoryChips(id) {
  const box = $(`[data-category-chip-box="${escapeCssIdentifier(id)}"]`);
  if (!box) return;
  $$("[data-category-chip]", box).forEach((button) => button.addEventListener("click", () => {
    const selected = selectedCategoryChips(id);
    const category = button.dataset.categoryChip;
    const next = selected.includes(category) ? selected.filter((item) => item !== category) : [...selected, category];
    box.outerHTML = categoryChips(id, next);
    bindCategoryChips(id);
  }));
}

function selectedCategoryChips(id) {
  const box = $(`[data-category-chip-box="${escapeCssIdentifier(id)}"]`);
  if (!box) return [];
  return $$("[data-category-selected] .category-chip", box).map((button) => button.dataset.categoryChip).filter(Boolean);
}

function addressFields(id, value = "") {
  const address = parseAddress(value);
  const barangays = sortedBarangays(state.geography.barangays);
  const selectedBarangay = barangays.includes(address.barangay) ? address.barangay : "";
  return `
    <div class="address-grid" data-address-group="${escapeAttribute(id)}">
      <label><span>Region</span>${select(`${id}-region`, [state.geography.region], state.geography.region)}</label>
      <label><span>City</span>${select(`${id}-city`, [state.geography.city], state.geography.city)}</label>
      <label><span>Barangay</span>${select(`${id}-barangay`, barangays, selectedBarangay, "Choose barangay")}</label>
      <label><span>Purok</span><input class="form-control" data-address-purok value="${escapeAttribute(address.purok)}" placeholder="Purok / Zone"></label>
      <label><span>House No. <small>(optional)</small></span><input class="form-control" data-address-house value="${escapeAttribute(address.house)}" placeholder="House no."></label>
    </div>
  `;
}

function bindAddressGroup(id) {
  const group = $(`[data-address-group="${escapeCssIdentifier(id)}"]`);
  if (!group) return;
  const city = $(`#${id}-city`, group);
  const barangay = $(`#${id}-barangay`, group);
  city?.addEventListener("change", () => {
    barangay.innerHTML = `<option value="">Choose barangay</option>${sortedBarangays(state.geography.barangays).map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("")}`;
  });
}

function sortedBarangays(barangays = []) {
  return Array.from(new Set(barangays.map((item) => String(item || "").trim()).filter(Boolean)))
    .sort((left, right) => BARANGAY_COLLATOR.compare(left, right));
}

function addressValue(id) {
  const group = $(`[data-address-group="${escapeCssIdentifier(id)}"]`);
  if (!group) return "";
  const barangay = $(`#${id}-barangay`, group)?.value || "";
  if (!barangay) return "";
  const city = $(`#${id}-city`, group)?.value || state.geography.city;
  const purok = $("[data-address-purok]", group)?.value.trim() || "";
  const house = $("[data-address-house]", group)?.value.trim() || "";
  return [house, purok, barangay, city].filter(Boolean).join(", ");
}

function parseAddress(value = "") {
  const parts = String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
  const cityIndex = parts.findIndex((part) => /gingoog/i.test(part));
  const beforeCity = cityIndex >= 0 ? parts.slice(0, cityIndex) : parts;
  const barangay = [...beforeCity].reverse().find((part) => state.geography.barangays.includes(part)) || beforeCity[beforeCity.length - 1] || "";
  const detailParts = beforeCity.filter((part) => part !== barangay);
  return {
    house: detailParts.length > 1 ? detailParts[0] : "",
    purok: detailParts.length ? detailParts[detailParts.length - 1] : "",
    barangay,
  };
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

function escapeCssIdentifier(value) {
  return window.CSS?.escape ? window.CSS.escape(String(value)) : String(value).replace(/["\\]/g, "\\$&");
}

function phoneLink(value, preferredChannel = "") {
  const label = String(value || "").trim();
  const tel = label.replace(/[^\d+]/g, "");
  if (!tel) return escapeHtml(label);
  const scheme = /sms/i.test(preferredChannel) ? "sms" : "tel";
  const action = scheme === "sms" ? "SMS" : "Call";
  return `<a href="${scheme}:${escapeAttribute(tel)}" title="${action} ${escapeAttribute(label)}">${escapeHtml(label)}</a>`;
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

function currencyNumber(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "open") return 0;
  const amount = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
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
