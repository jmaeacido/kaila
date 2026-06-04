const CHANNEL = "kaila-mvp";
const STORAGE = {
  session: "kaila.deploy.session",
  socketUrl: "kaila.deploy.socketUrl",
  theme: "kaila.deploy.theme",
  clientSurveyDraft: "kaila.deploy.validationDraft.clientSurvey",
  providerInterviewDraft: "kaila.deploy.validationDraft.providerInterview",
  stateSnapshot: "kaila.deploy.stateSnapshot",
  validationQueue: "kaila.deploy.validationQueue",
  offlineCredentials: "kaila.deploy.offlineCredentials",
  attentionBadges: "kaila.deploy.attentionBadges",
  messageReads: "kaila.deploy.messageReads",
  notificationReads: "kaila.deploy.notificationReads",
};
const SERVICE_CATEGORIES = ["Appliance repair", "Plumbing", "Electrical", "Computer repair", "Cellphone repair", "Mechanical / motorcycle", "Carpentry / home maintenance", "Graphic / digital services", "General odd jobs"];
const URGENCY_OPTIONS = ["Emergency", "Today", "This Week", "Scheduled", "Flexible"];
const CONTACT_CHANNELS = ["Messenger", "SMS", "Call", "Email", "Other"];
const PROVIDER_TYPES = ["Individual", "Freelancer", "Shop", "Small team", "Business"];
const EXPERIENCE_OPTIONS = ["Less than 1", "1-2", "3-5", "6-10", "10+"];
const EMERGENCY_OPTIONS = ["Yes", "No", "Sometimes"];
const AVAILABILITY_OPTIONS = ["Today", "Weekdays", "Weekends", "Emergency only"];
const AVAILABLE_DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const AVAILABLE_TIME_OPTIONS = ["Any time", "Morning", "Afternoon", "Evening", "Business hours", "After hours", "By appointment"];
const YES_NO_MAYBE_OPTIONS = ["Yes", "No", "Maybe"];
const DECISION_SIGNAL_OPTIONS = ["Strong positive", "Positive", "Neutral", "Concern", "Blocker"];
const SUPPORT_ROLE = "customer_service";
const SUPPORT_LABEL = "Customer Service";
const SUPPORT_AVATAR = "assets/kaila-customer-service-avatar.png";
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
  validationEntries: [],
  activity: [],
  missedCalls: [],
  socket: null,
  connected: false,
  userInteracted: false,
  attentionQueue: [],
  unreadNotifications: 0,
  unreadNotificationItems: [],
  unreadMessages: [],
  attentionTimer: null,
  attentionOpen: false,
  activeOfferPromptRequestId: null,
  lastDashboardTabTarget: "#requests-pane",
  activeConversationId: null,
  activeDirectConversationUserId: null,
  activeDirectConversationRequestId: "",
  conversationDraftVersion: 0,
  directConversationDraftVersion: 0,
  messageSummarySyncing: false,
  notificationSummarySyncing: false,
  validationSyncing: false,
  typingTimer: null,
  typingSent: false,
  presenceTimer: null,
  realtimePollTimer: null,
  conversationPollTimer: null,
  call: null,
  adminMetric: "",
  theme: localStorage.getItem(STORAGE.theme) || "system",
  geography: FALLBACK_GEOGRAPHY,
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadAttentionBadgesForSession();
  registerServiceWorker();
  setupAttentionNotifications();
  setupOfflineSync();
  initializeTheme();
  bindEvents();
  initializeSocketUrl();
  await loadGeography();
  renderRegisterAddress();
  await loadState();
  syncQueuedValidationEntries();
  route(state.session ? "app" : "landing");
  connectSocket();
}

function setupOfflineSync() {
  window.addEventListener("online", () => {
    addActivity("Back online", "KAILA will sync saved offline validation entries.");
    renderConnectivity();
    syncQueuedValidationEntries();
  });
  window.addEventListener("offline", () => {
    addActivity("Offline mode", "You can keep saving validation entries. They will sync automatically later.");
    renderConnectivity();
  });
}

function setupAttentionNotifications() {
  const markInteraction = () => {
    state.userInteracted = true;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  };
  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, markInteraction, { once: true, passive: true });
  });
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
  $("[data-notification-bell]")?.addEventListener("click", openNotificationBell);
  $("[data-message-bell]")?.addEventListener("click", openMessageBell);
  $("[data-settings-tab]")?.addEventListener("shown.bs.tab", renderSettings);
  $("[data-settings-tab]")?.addEventListener("click", renderSettings);
  $("[data-activity-tab]")?.addEventListener("shown.bs.tab", clearUnreadNotifications);
  $("[data-activity-tab]")?.addEventListener("click", clearUnreadNotifications);
  $$(".app-tabs .nav-link").forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => rememberDashboardTab(tab.dataset.bsTarget));
    tab.addEventListener("click", () => rememberDashboardTab(tab.dataset.bsTarget));
  });
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
  localStorage.setItem(STORAGE.socketUrl, input.value);
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
  if (host) {
    host.innerHTML = addressFields("register-address", state.session?.area || "");
    bindAddressGroup("register-address");
  }
  const coverage = $("[data-register-coverage]");
  if (coverage) {
    coverage.innerHTML = coverageAreaChips("register-coverage", "");
    bindCategoryChips("register-coverage");
  }
  const days = $("[data-register-days]");
  if (days) {
    days.innerHTML = availableDaysChips("register-days", "");
    bindCategoryChips("register-days");
  }
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

  let response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const offlineMessage = path === "/api/login"
      ? "You are offline. Use offline login on a device that has already verified this account online."
      : "You are offline. Saved validation entries will sync later.";
    const unavailableMessage = path === "/api/login"
      ? "KAILA API is unavailable. Offline login is available after one verified login on this device."
      : "KAILA API is unavailable. Saved validation entries will sync later.";
    const offlineError = new Error(navigator.onLine ? unavailableMessage : offlineMessage);
    offlineError.offline = true;
    offlineError.cause = error;
    throw offlineError;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (!options.silentError) console.error("KAILA API error", { path, status: response.status, payload });
    const apiError = new Error(payload.error || response.statusText || "Request failed");
    apiError.status = response.status;
    apiError.payload = payload;
    throw apiError;
  }
  return payload;
}

async function loadState(options = {}) {
  try {
    const payload = await apiFetch("/api/state", { method: "GET" });
    applyServerState(payload);
    if (state.session && !state.users.some((user) => user.id === state.session.id)) {
      localStorage.removeItem(STORAGE.session);
      state.session = null;
      return;
    }
    await syncUnreadNotificationSummaries();
    await syncUnreadMessageSummaries();
  } catch {
    const cached = readJson(STORAGE.stateSnapshot, null);
    if (cached) {
      applyServerState(cached, { fromCache: true });
      if (!options.silent) addActivity("Offline snapshot loaded", "KAILA is using the last saved state on this device.");
      return;
    }
    state.validationEntries = mergeQueuedValidationEntries([]);
    render();
    if (!options.silent) addActivity("Offline mode", "KAILA can open offline, but no previous state snapshot is saved on this device.");
  }
}

function applyServerState(payload = {}, options = {}) {
  state.users = payload.users || state.users || [];
  state.providers = payload.providers || [];
  state.requests = payload.requests || [];
  if ("validationEntries" in payload) state.validationEntries = mergeQueuedValidationEntries(payload.validationEntries || []);
  else state.validationEntries = mergeQueuedValidationEntries(state.validationEntries || []);
  state.activity = payload.activities || state.activity || [];
  if (state.session && !options.fromCache) {
    const freshSession = state.users.find((user) => user.id === state.session.id);
    if (freshSession) {
      state.session = { ...state.session, ...freshSession };
      localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
    }
  }
  if (!options.fromCache) cacheStateSnapshot();
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
  data.availableDays = selectedCategoryChips("register-days").join(", ");
  data.availableTime = timeRangeValue("[data-register-form] [name='availableTimeStart']", "[data-register-form] [name='availableTimeEnd']");
  data.coverageArea = selectedCategoryChips("register-coverage").join(", ");
  data.minimumFee = normalizeCurrencyInput(data.minimumFee);
  data.priceRange = priceRangeValue("[data-register-form] [name='priceRangeMin']", "[data-register-form] [name='priceRangeMax']");
  delete data.availableTimeStart;
  delete data.availableTimeEnd;
  delete data.priceRangeMin;
  delete data.priceRangeMax;
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
  loadAttentionBadgesForSession();
  await rememberOfflineLogin(data.username, data.password, payload.user);
  syncSocketIdentity();
  safeApplyState(payload.state);
  await syncUnreadNotificationSummaries();
  await syncUnreadMessageSummaries();
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
    if (error.offline && await tryOfflineLogin(data)) {
      form.reset();
      return;
    }
    notify("Login failed", error.message, "error");
    return;
  }

  state.session = payload.user;
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  loadAttentionBadgesForSession();
  await rememberOfflineLogin(data.username, data.password, payload.user);
  syncSocketIdentity();
  safeApplyState(payload.state);
  await syncUnreadNotificationSummaries();
  await syncUnreadMessageSummaries();
  form.reset();
  await successRedirect("Logged in", `Welcome back, ${state.session.name}.`);
}

async function openForgotPasswordModal() {
  await modal({
    title: "Account help",
    html: `<p class="text-start mb-0">For pilot account recovery, contact a KAILA administrator. For safety, passwords cannot be reset with only public profile details.</p>`,
    icon: "info",
    confirmButtonText: "OK",
  });
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
  loadAttentionBadgesForSession();
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
  renderCustomerService();
  renderOps();
  renderValidation();
  renderActivity();
  renderSettings();
  renderStats();
  renderConnectivity();
  bindDirectContactActions();
  bindDashboardAnalytics();
}

function renderNav() {
  const signedIn = Boolean(state.session);
  $("[data-current-user]").classList.toggle("d-none", !signedIn);
  $("[data-app-link]").classList.toggle("d-none", !signedIn);
  $$("[data-notification-bell], [data-message-bell]").forEach((button) => button.classList.toggle("d-none", !signedIn));
  if (signedIn) $("[data-current-user]").textContent = `${state.session.name} (${state.session.role})`;
  const summary = $("[data-current-user-summary]");
  if (summary && signedIn) summary.textContent = `${state.session.name} - ${state.session.area || state.session.role}`;
  const userPhoto = $("[data-app-user-photo]");
  if (userPhoto) {
    userPhoto.src = signedIn ? resolveMediaUrl(state.session.photoUrl) : "assets/android-chrome-192x192.png";
    userPhoto.alt = signedIn ? `${state.session.name} photo` : "";
  }
  renderAttentionBadges();
}

function renderConnectivity() {
  const summary = offlineQueueSummary();
  const online = navigator.onLine;
  const statusText = online ? "Online" : "Offline";
  const queueText = summary.total ? `${summary.total} queued` : "Queue clear";
  const detailText = summary.total
    ? `${summary.validation} validation entr${summary.validation === 1 ? "y" : "ies"} waiting to sync.`
    : "No saved entries are waiting to sync.";

  $$("[data-queue-status]").forEach((el) => {
    el.classList.toggle("offline", !online);
    el.classList.toggle("has-queue", summary.total > 0);
    el.textContent = `${statusText} / ${queueText}`;
    el.title = detailText;
  });

  $$("[data-login-queue-status]").forEach((el) => {
    el.classList.toggle("offline", !online);
    el.classList.toggle("has-queue", summary.total > 0);
    el.innerHTML = `
      <strong>${statusText}</strong>
      <span>${online ? "Login will verify with the server." : "Offline login works after one verified login on this device."}</span>
      <small>${queueText}. ${escapeHtml(detailText)}</small>
    `;
  });
}

function renderTabs() {
  const requestsTab = $("[data-requests-tab]");
  const providersTab = $("[data-providers-tab]");
  const clientsTab = $("[data-clients-tab]");
  const customerServiceTab = $("[data-customer-service-tab]");
  const opsTab = $("[data-ops-tab]");
  const activityTab = $("[data-activity-tab]");
  const validationTab = $("[data-validation-tab]");
  if (!providersTab) return;
  const isOps = state.session?.role === "ops";
  const isSupport = state.session?.role === SUPPORT_ROLE;
  const hideProviders = state.session?.role === "provider" || isOps;
  if (requestsTab) requestsTab.hidden = isOps;
  providersTab.hidden = hideProviders;
  if (clientsTab) clientsTab.hidden = !["admin", SUPPORT_ROLE].includes(state.session?.role);
  if (customerServiceTab) customerServiceTab.hidden = !["admin", "client", "provider", SUPPORT_ROLE].includes(state.session?.role);
  if (opsTab) opsTab.hidden = state.session?.role !== "admin";
  if (activityTab) activityTab.hidden = isOps;
  if (validationTab) validationTab.hidden = !["admin", "ops"].includes(state.session?.role);
  if (hideProviders && providersTab.querySelector(".nav-link")?.classList.contains("active")) {
    activateTab("#requests-pane");
  }
  if (!["admin", SUPPORT_ROLE].includes(state.session?.role) && clientsTab?.classList.contains("active")) activateTab("#requests-pane");
  if (!["admin", "client", "provider", SUPPORT_ROLE].includes(state.session?.role) && customerServiceTab?.classList.contains("active")) activateTab("#requests-pane");
  if (state.session?.role !== "admin" && opsTab?.classList.contains("active")) activateTab("#requests-pane");
  if (!["admin", "ops"].includes(state.session?.role) && validationTab?.classList.contains("active")) activateTab("#requests-pane");
  if (isOps && !validationTab?.classList.contains("active")) activateTab("#validation-pane");
  if (isSupport && !["#requests-pane", "#clients-pane", "#providers-pane", "#customer-service-pane", "#activity-pane", "#settings-pane"].includes(state.lastDashboardTabTarget)) activateTab("#customer-service-pane");
}

function activateTab(target) {
  $$(".compact-tabs .nav-link").forEach((tab) => tab.classList.toggle("active", tab.dataset.bsTarget === target));
  $$(".tab-pane").forEach((pane) => {
    const active = `#${pane.id}` === target;
    pane.classList.toggle("active", active);
    pane.classList.toggle("show", active);
  });
  rememberDashboardTab(target);
  if (target === "#activity-pane") clearUnreadNotifications();
}

function rememberDashboardTab(target) {
  if (!target || target === "#activity-pane") return;
  state.lastDashboardTabTarget = target;
}

function fallbackDashboardTab() {
  const lastTab = $(`.app-tabs .nav-link[data-bs-target="${escapeAttribute(state.lastDashboardTabTarget)}"]`);
  if (lastTab && !lastTab.hidden) return state.lastDashboardTabTarget;
  const tab = $$(".app-tabs .nav-link").find((item) => !item.hidden && !["#activity-pane", "#settings-pane"].includes(item.dataset.bsTarget));
  return tab?.dataset.bsTarget || "#requests-pane";
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
  row.dataset.actionLayout = ["client", "provider"].includes(state.session.role) ? "single-row" : "default";

  const actions = [];
  if (state.session.role === "client") {
    actions.push(`<button class="btn btn-primary" type="button" data-new-request><i class="fa-solid fa-plus"></i><span>Post Request</span></button>`);
  }
  if (state.session.role === "provider") {
    actions.push(`<button class="btn btn-outline-primary" type="button" data-provider-profile><i class="fa-solid fa-id-card"></i><span>${state.session.role === "provider" ? "Provider Profile" : "Add Provider"}</span></button>`);
  }
  if (["client", "provider"].includes(state.session.role)) {
    actions.push(`<button class="btn btn-outline-primary" type="button" data-open-support><i class="fa-solid fa-headset"></i><span>Customer Service</span></button>`);
  }
  if (state.session.role === "admin") {
    actions.push(`<button class="btn btn-primary" type="button" data-admin-create-account><i class="fa-solid fa-user-plus"></i><span>Create Account</span></button>`);
  }
  if (state.session.role === SUPPORT_ROLE) {
    actions.push(`<button class="btn btn-primary" type="button" data-open-support><i class="fa-solid fa-headset"></i><span>Support Desk</span></button>`);
  }
  if (["admin", "ops"].includes(state.session.role)) {
    actions.push(`<button class="btn btn-outline-primary" type="button" data-client-survey><i class="fa-solid fa-square-poll-vertical"></i><span>Client Survey</span></button>`);
    actions.push(`<button class="btn btn-outline-primary" type="button" data-provider-interview><i class="fa-solid fa-comments"></i><span>Provider Interview</span></button>`);
  }
  if (state.session.role === "ops") {
    const admin = state.users.find((user) => user.role === "admin");
    if (admin) actions.push(`<button class="btn btn-outline-primary" type="button" data-direct-chat="${admin.id}"><i class="fa-solid fa-headset"></i><span>Admin Support</span></button>`);
  }
  if (state.session.role !== "ops") {
    actions.push(`<button class="btn btn-outline-secondary" type="button" data-team-note title="Post a short note to the shared Activity feed."><i class="fa-solid fa-note-sticky"></i><span>Team Note</span></button>`);
  }
  row.innerHTML = actions.join("");

  $("[data-new-request]")?.addEventListener("click", openRequestModal);
  $("[data-provider-profile]")?.addEventListener("click", openProviderModal);
  $("[data-admin-create-account]")?.addEventListener("click", openAdminCreateAccountModal);
  $("[data-client-survey]")?.addEventListener("click", openClientSurveyModal);
  $("[data-provider-interview]")?.addEventListener("click", openProviderInterviewModal);
  $("[data-open-support]")?.addEventListener("click", openCustomerServicePlatform);
  $("[data-team-note]")?.addEventListener("click", openMessageModal);
  $("[data-dashboard-title]").textContent = `${roleLabel(state.session.role)} Dashboard`;
  $("[data-role-pill]").textContent = roleLabel(state.session.role);
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

function openCustomerServicePlatform() {
  route("app");
  activateTab(state.session?.role === SUPPORT_ROLE ? "#customer-service-pane" : "#customer-service-pane");
  requestAnimationFrame(() => {
    $("[data-customer-service-list]")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  if (state.session?.role === "ops") {
    host.innerHTML = "";
    return;
  }
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
  return `<article class="k-card admin-metric-panel"><h3>${escapeHtml(entry[0])}</h3><p>${escapeHtml(entry[1])}</p>${analyticsInsightButton()}</article>`;
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
      ${["admin", "ops", SUPPORT_ROLE].includes(state.session?.role) ? `
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
  if (/^(?:\.\/)?assets\//i.test(url)) return url.replace(/^\.\//, "");
  return `${apiBase()}${url}`;
}

function userProfile(userId) {
  return state.users.find((user) => user.id === userId) || {};
}

function canDirectContact(target = {}) {
  if (!state.session || !target.id || target.id === state.session.id) return false;
  if (state.session.role === "admin") return ["admin", "ops", SUPPORT_ROLE, "provider", "client"].includes(target.role);
  if (state.session.role === SUPPORT_ROLE) return ["admin", SUPPORT_ROLE, "provider", "client"].includes(target.role);
  if (target.role === SUPPORT_ROLE) return ["provider", "client"].includes(state.session.role);
  return state.session.role === "ops" && target.role === "admin";
}

function canViewDirectContact(target = {}) {
  if (canDirectContact(target)) return true;
  if (!state.session || !target.id || target.id === state.session.id) return false;
  return ["admin", SUPPORT_ROLE].includes(target.role) && ["admin", "ops", SUPPORT_ROLE, "provider", "client"].includes(state.session.role);
}

function canDirectCall(target = {}) {
  if (!state.session || !target.id || target.id === state.session.id) return false;
  if (state.session.role === SUPPORT_ROLE) return ["client", "provider"].includes(target.role);
  if (state.session.role === "ops") return target.role === "admin";
  return state.session.role === "admin" && ["admin", "ops", SUPPORT_ROLE].includes(target.role);
}

function directConversationDisplayTarget(target = {}) {
  if (target.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session?.role)) {
    return { ...target, name: "KAILA Customer Service", photoUrl: SUPPORT_AVATAR };
  }
  return target;
}

function directConversationTitle(target = {}, requestContext = null) {
  const name = directConversationDisplayTarget(target).name || "Direct";
  return requestContext ? `${name} - ${requestContext.category}` : `${name} messages`;
}

function directConversationMessageKey(userId, requestId = "") {
  return requestId ? `${userId}:${requestId}` : userId;
}

function directConversationTopicHtml(request = {}) {
  return `
    <div class="chat-topic-card">
      <div>
        <strong>${escapeHtml(request.category || "Job request")}</strong>
        <span>${escapeHtml(request.status || "Request")} · ${escapeHtml(request.area || "No area")} · ${escapeHtml(formatCurrency(request.budget || "Open"))}</span>
      </div>
      ${request.details ? `<p>${escapeHtml(request.details)}</p>` : ""}
    </div>
  `;
}

function directContactButtons(userId) {
  const target = userProfile(userId);
  if (!canDirectContact(target)) return "";
  return `
    <div class="card-actions">
      <button class="btn btn-sm btn-outline-primary" type="button" data-direct-chat="${target.id}"><i class="fa-solid fa-message"></i> Message</button>
      ${canDirectCall(target) ? `
        <button class="btn btn-sm btn-outline-primary" type="button" data-direct-audio-call="${target.id}"><i class="fa-solid fa-phone"></i> Audio</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-direct-video-call="${target.id}"><i class="fa-solid fa-video"></i> Video</button>
      ` : ""}
    </div>
  `;
}

function bindDirectContactActions() {
  $$("[data-direct-chat]").forEach((button) => button.addEventListener("click", () => openDirectConversation(button.dataset.directChat, button.dataset.directRequestId || "")));
  $$("[data-direct-audio-call]").forEach((button) => button.addEventListener("click", () => startDirectAudioCall(button.dataset.directAudioCall)));
  $$("[data-direct-video-call]").forEach((button) => button.addEventListener("click", () => startDirectVideoCall(button.dataset.directVideoCall)));
}

function renderProviders() {
  const host = $("[data-provider-list]");
  if (!host) return;
  if (state.session?.role === "ops") {
    host.innerHTML = "";
    return;
  }
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
      ${directContactButtons(provider.userId)}
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
  return `<article class="k-card admin-metric-panel"><h3>${escapeHtml(entry[0])}</h3><p>${escapeHtml(entry[1])}</p>${analyticsInsightButton()}</article>`;
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
  if (!["admin", SUPPORT_ROLE].includes(state.session?.role)) {
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
        ${directContactButtons(client.id)}
      </article>
    `;
  }).join("");
}

function renderCustomerService() {
  const host = $("[data-customer-service-list]");
  if (!host) return;
  if (!["admin", "client", "provider", SUPPORT_ROLE].includes(state.session?.role)) {
    host.innerHTML = "";
    return;
  }

  const supportUsers = state.users.filter((user) => user.role === SUPPORT_ROLE);
  const activeRequests = state.requests.filter((request) => !["Cancelled", "Rated / Closed", "Resolved"].includes(request.status));
  const disputedRequests = state.requests.filter((request) => request.status === "Disputed" || request.disputeNote);

  if (state.session.role === SUPPORT_ROLE) {
    const waitingRequests = activeRequests.filter((request) => ["Posted", "Offers Received", "Countered", "Provider Marked Done", "Revision Requested", "Disputed"].includes(request.status));
    host.innerHTML = `
      <article class="k-card admin-metric-panel">
        <h3>Customer Service Desk</h3>
        <p>${activeRequests.length} active requests | ${disputedRequests.length} disputes | ${state.users.filter((user) => user.role === "client").length} clients | ${state.providers.length} providers</p>
      </article>
      ${waitingRequests.length ? waitingRequests.slice(0, 8).map(renderSupportRequestSummary).join("") : emptyCard("No support queue", "Active jobs that need attention will appear here.")}
    `;
    bindCustomerServiceActions(host);
    return;
  }

  if (!supportUsers.length) {
    host.innerHTML = emptyCard("Customer service not assigned", "An admin can create a Customer Service account for direct support.");
    return;
  }

  const primarySupport = supportUsers[0];
  const supportContact = { ...primarySupport, name: "KAILA Customer Service", role: SUPPORT_ROLE, photoUrl: SUPPORT_AVATAR };
  host.innerHTML = `
    <article class="k-card admin-metric-panel">
      <h3>Customer Service</h3>
      <p>Message support for account help, request questions, provider coordination, or dispute guidance.</p>
    </article>
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          ${renderIdentity(supportContact.name, supportContact.photoUrl, "Support channel", supportContact.reputation)}
          <p>Official KAILA support channel for clients and providers.</p>
        </div>
        <span class="badge text-bg-light align-self-start">${SUPPORT_LABEL}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-outline-primary" type="button" data-direct-chat="${escapeAttribute(primarySupport.id)}"><i class="fa-solid fa-message"></i> Message Support</button>
      </div>
    </article>
  `;
}

function renderSupportRequestSummary(request) {
  return `
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          <h3>${escapeHtml(request.category)}</h3>
          <p>${escapeHtml(request.details || "No details")}</p>
        </div>
        <span class="badge text-bg-${statusColor(request.status)} align-self-start">${escapeHtml(request.status)}</span>
      </div>
      <div class="meta">
        <span>${escapeHtml(request.clientName || "Client")}</span>
        <span>${escapeHtml(request.area || "No area")}</span>
        <span>${visibleOffers(request).length} offer${visibleOffers(request).length === 1 ? "" : "s"}</span>
        ${request.acceptedProviderId ? "<span>Provider selected</span>" : ""}
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-outline-primary" type="button" data-support-focus-request="${escapeAttribute(request.id)}"><i class="fa-solid fa-clipboard-list"></i> View Request</button>
        ${request.clientId ? `<button class="btn btn-sm btn-outline-primary" type="button" data-direct-chat="${escapeAttribute(request.clientId)}" data-direct-request-id="${escapeAttribute(request.id)}"><i class="fa-solid fa-message"></i> Client</button>` : ""}
        ${request.acceptedProviderId ? `<button class="btn btn-sm btn-outline-primary" type="button" data-direct-chat="${escapeAttribute(request.acceptedProviderId)}" data-direct-request-id="${escapeAttribute(request.id)}"><i class="fa-solid fa-message"></i> Provider</button>` : ""}
        ${jobActionButtons(request)}
      </div>
    </article>
  `;
}

function bindCustomerServiceActions(host = document) {
  $$("[data-support-focus-request]", host).forEach((button) => {
    button.addEventListener("click", () => focusRequestCard(button.dataset.supportFocusRequest));
  });
  $$("[data-job-action]", host).forEach((button) => {
    button.addEventListener("click", () => openJobAction(button.dataset.requestId, button.dataset.jobAction));
  });
}

function renderOps() {
  const host = $("[data-ops-list]");
  if (!host) return;
  if (state.session?.role !== "admin") {
    host.innerHTML = "";
    return;
  }

  const opsUsers = state.users.filter((user) => user.role === "ops");
  const adminUsers = state.users.filter((user) => user.role === "admin" && user.id !== state.session.id);
  const adminSection = adminUsers.length ? `
    <article class="k-card admin-metric-panel">
      <h3>Admin Team</h3>
      <p>${adminUsers.length} other admin account${adminUsers.length === 1 ? "" : "s"} available for direct coordination.</p>
    </article>
    ${adminUsers.map((user) => `
      <article class="k-card">
        <div class="d-flex justify-content-between gap-2">
          <div>
            ${renderIdentity(user.name, user.photoUrl, "Admin account", user.reputation)}
            <p>${escapeHtml(user.username || "No username")} ${user.contactNumber ? `- ${escapeHtml(user.contactNumber)}` : ""}</p>
          </div>
          <span class="badge text-bg-light align-self-start">Admin</span>
        </div>
        <div class="meta">
          <span>${escapeHtml(user.area || "Operations")}</span>
          ${user.preferredContactChannel ? `<span>${escapeHtml(user.preferredContactChannel)}</span>` : ""}
          ${user.bestContactTime ? `<span>${escapeHtml(user.bestContactTime)}</span>` : ""}
        </div>
        ${directContactButtons(user.id)}
      </article>
    `).join("")}
  ` : "";
  const summary = `
    <article class="k-card admin-metric-panel">
      <h3>Ops Team</h3>
      <p>${opsUsers.length} ops account${opsUsers.length === 1 ? "" : "s"} focused on validation capture and future operations-only functions.</p>
    </article>
  `;
  if (!opsUsers.length) {
    host.innerHTML = `${adminSection}${summary}${emptyCard("No ops accounts yet", "Use Create Account and choose the Ops role.")}`;
    return;
  }

  host.innerHTML = `${adminSection}${summary}${opsUsers.map((user) => {
    const entries = state.validationEntries.filter((entry) => entry.operatorId === user.id);
    const clientSurveys = entries.filter((entry) => entry.type === "client_survey").length;
    const providerInterviews = entries.filter((entry) => entry.type === "provider_interview").length;
    const latestEntry = entries[0];
    return `
      <article class="k-card">
        <div class="d-flex justify-content-between gap-2">
          <div>
            ${renderIdentity(user.name, user.photoUrl, "Ops account", user.reputation)}
            <p>${escapeHtml(user.username || "No username")} ${user.contactNumber ? `- ${escapeHtml(user.contactNumber)}` : ""}</p>
          </div>
          <span class="badge text-bg-light align-self-start">${entries.length} validation entr${entries.length === 1 ? "y" : "ies"}</span>
        </div>
        <div class="meta">
          <span>${escapeHtml(user.area || "Operations")}</span>
          ${user.preferredContactChannel ? `<span>${escapeHtml(user.preferredContactChannel)}</span>` : ""}
          ${user.bestContactTime ? `<span>${escapeHtml(user.bestContactTime)}</span>` : ""}
          <span>${clientSurveys} surveys</span>
          <span>${providerInterviews} interviews</span>
        </div>
        ${latestEntry ? `<div class="offer"><strong>Latest validation</strong><div>${escapeHtml(latestEntry.subjectName)} - ${escapeHtml(latestEntry.decisionSignal || "No signal")} - ${formatDateTime(latestEntry.createdAt)}</div></div>` : ""}
        ${directContactButtons(user.id)}
      </article>
    `;
  }).join("")}`;
}

function renderValidation() {
  const host = $("[data-validation-list]");
  if (!host) return;
  if (!["admin", "ops"].includes(state.session?.role)) {
    host.innerHTML = "";
    return;
  }

  const entries = state.validationEntries || [];
  const clientSurveys = entries.filter((entry) => entry.type === "client_survey").length;
  const providerInterviews = entries.filter((entry) => entry.type === "provider_interview").length;
  const positiveSignals = entries.filter((entry) => ["Strong positive", "Positive"].includes(entry.decisionSignal)).length;
  const blockers = entries.filter((entry) => entry.decisionSignal === "Blocker").length;
  const pendingSync = entries.filter((entry) => entry.pendingSync).length;
  const summary = `
    <article class="k-card admin-metric-panel">
      <h3>Validation Evidence</h3>
      <p>${entries.length} entries | ${clientSurveys} client surveys | ${providerInterviews} provider interviews | ${positiveSignals} positive signals | ${blockers} blockers${pendingSync ? ` | ${pendingSync} pending sync` : ""}</p>
      ${state.session?.role === "admin" ? analyticsInsightButton() : ""}
    </article>
  `;

  if (!entries.length) {
    host.innerHTML = `${summary}${emptyCard("No validation entries yet", "Ops can record client surveys and provider interviews from Quick actions.")}`;
    return;
  }

  host.innerHTML = `${summary}${entries.map(renderValidationEntry).join("")}`;
  bindValidationEntryActions();
}

function renderValidationEntry(entry) {
  const title = entry.type === "client_survey" ? "Client Survey" : "Provider Interview";
  const responses = entry.responses || {};
  const canEdit = canEditValidationEntry(entry);
  const canDelete = canDeleteValidationEntry(entry);
  const highlights = Object.entries(responses)
    .filter(([key, value]) => value && !["name", "providerName", "area", "coverageArea", "decisionSignal", "notes"].includes(key))
    .slice(0, 8);
  return `
    <article class="k-card">
      <div class="d-flex justify-content-between gap-2">
        <div>
          <h3>${title}: ${escapeHtml(entry.subjectName)}</h3>
          <p>${escapeHtml(entry.category || "No category")} ${entry.area ? `- ${escapeHtml(entry.area)}` : ""}</p>
        </div>
        ${entry.decisionSignal ? `<span class="badge text-bg-${validationSignalColor(entry.decisionSignal)} align-self-start">${escapeHtml(entry.decisionSignal)}</span>` : ""}
      </div>
      ${canEdit || canDelete ? `
        <div class="d-flex gap-2 flex-wrap mt-2">
          ${canEdit ? `<button class="btn btn-sm btn-outline-primary" type="button" data-edit-validation="${escapeAttribute(entry.id)}"><i class="fa-solid fa-pen-to-square"></i><span>Edit</span></button>` : ""}
          ${canDelete ? `<button class="btn btn-sm btn-outline-danger" type="button" data-delete-validation="${escapeAttribute(entry.id)}"><i class="fa-solid fa-trash"></i><span>Delete</span></button>` : ""}
        </div>
      ` : ""}
      <div class="meta">
        <span>${escapeHtml(entry.operatorName || "Ops")}</span>
        <span>${formatDateTime(entry.createdAt)}</span>
        ${entry.pendingSync ? "<span>Pending sync</span>" : ""}
      </div>
      <div class="offer">
        ${highlights.map(([key, value]) => `<div><strong>${escapeHtml(validationLabel(key))}:</strong> ${escapeHtml(value)}</div>`).join("")}
        ${entry.notes ? `<div><strong>Notes:</strong> ${escapeHtml(entry.notes)}</div>` : ""}
      </div>
    </article>
  `;
}

function canEditValidationEntry(entry = {}) {
  return Boolean(!entry.pendingSync && ["admin", "ops"].includes(state.session?.role));
}

function canDeleteValidationEntry(entry = {}) {
  return Boolean(!entry.pendingSync && state.session?.role === "admin");
}

function bindValidationEntryActions() {
  $$("[data-edit-validation]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = state.validationEntries.find((item) => item.id === button.dataset.editValidation);
      if (entry) openValidationEditModal(entry);
    });
  });
  $$("[data-delete-validation]").forEach((button) => {
    button.addEventListener("click", () => deleteValidationEntry(button.dataset.deleteValidation));
  });
}

function validationSignalColor(signal) {
  if (signal === "Strong positive" || signal === "Positive") return "success";
  if (signal === "Concern") return "warning";
  if (signal === "Blocker") return "danger";
  return "secondary";
}

function validationLabel(key) {
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function analyticsInsightButton() {
  return `
    <button class="btn btn-sm btn-outline-primary ai-insight-button" type="button" data-dashboard-ai-insight>
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>AI Insight</span>
    </button>
  `;
}

function bindDashboardAnalytics() {
  $$("[data-dashboard-ai-insight]").forEach((button) => {
    button.onclick = () => openDashboardAiInsight();
  });
}

async function openDashboardAiInsight() {
  if (state.session?.role !== "admin") return;
  window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    title: "Reading dashboard",
    text: "AI is summarizing the pilot analytics.",
    allowOutsideClick: false,
    didOpen: () => window.Swal.showLoading(),
  });
  try {
    const insight = await apiFetch("/api/analytics/insights", { method: "POST", body: "{}" });
    window.Swal.close();
    await modal({
      title: "AI Dashboard Insight",
      html: `
        <div class="ai-insight-panel">
          <p>${escapeHtml(insight.summary || "No summary returned.")}</p>
          ${insight.risks?.length ? `<div><strong>Risks</strong><ul>${insight.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
          ${insight.actions?.length ? `<div><strong>Actions</strong><ul>${insight.actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
        </div>
      `,
      confirmButtonText: "OK",
      showCancelButton: false,
    });
  } catch (error) {
    window.Swal.close();
    notify("AI insight failed", error.message, "error");
  }
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
        <label><span>Name</span><input class="form-control" name="name" autocomplete="name" maxlength="80" value="${escapeAttribute(state.session.name || "")}" required></label>
        <label><span>Contact number</span><input class="form-control" name="contactNumber" type="tel" inputmode="tel" autocomplete="tel" maxlength="32" value="${escapeAttribute(state.session.contactNumber || "")}"></label>
        <label><span>Messenger / Facebook</span><input class="form-control" name="messengerLink" inputmode="url" autocomplete="url" maxlength="240" value="${escapeAttribute(state.session.messengerLink || "")}"></label>
        <label><span>Preferred contact</span>${select("settings-contact-channel", CONTACT_CHANNELS, state.session.preferredContactChannel || "Messenger")}</label>
        <label><span>Best contact time</span>${select("settings-best-time", AVAILABLE_TIME_OPTIONS, state.session.bestContactTime || "", "Choose time")}</label>
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
  if (state.session?.role === "ops") {
    $("[data-activity-feed]").innerHTML = "";
    $("[data-live-feed]").innerHTML = "";
    return;
  }
  const missedCallCards = state.missedCalls.map(renderMissedCallActivity).join("");
  const activityCards = state.activity.map((item) => `<article class="k-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join("");
  const html = missedCallCards || activityCards
    ? `${missedCallCards}${activityCards}`
    : emptyCard("No activity yet", "Real-time events will appear here.");
  $("[data-activity-feed]").innerHTML = html;
  $("[data-live-feed]").innerHTML = html;
}

function renderMissedCallActivity(call = {}) {
  const callLabel = call.callType === "video" ? "video call" : "audio call";
  const context = call.contextTitle ? ` for ${call.contextTitle}` : "";
  const detail = call.callerId === state.session?.id
    ? `You called${context}, but the call was not answered.`
    : `${call.callerName || "A KAILA user"} tried to call${context}.`;
  return `
    <article class="k-card missed-call-card">
      <h3>Missed ${callLabel}</h3>
      <p>${escapeHtml(detail)}</p>
      <small>${escapeHtml(formatDateTime(call.createdAt))}</small>
    </article>
  `;
}

async function openClientSurveyModal(entry = null) {
  const isEdit = Boolean(entry?.id);
  const values = entry?.responses || {};
  const result = await modal({
    title: isEdit ? "Edit Client Survey" : "Client Survey Form",
    html: `
      <div class="swal-form two">
        ${validationBriefer("client_survey")}
        ${isEdit ? "" : validationDraftTools("client_survey")}
        <label>${questionLabel("Name or nickname", "Who gave this response. A nickname is enough for privacy, but it should let Ops follow up if needed.")}<input id="survey-name" class="form-control" maxlength="80" value="${escapeAttribute(values.name || entry?.subjectName || "")}"></label>
        <label>${questionLabel("Age range", "Optional demographic context. Use it only for broad validation patterns, not individual targeting.")}${select("survey-age", ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"], values.ageRange || "", "Optional")}</label>
        <label class="wide">${questionLabel("Barangay / area", "Maps where demand is coming from so Admin can decide which areas are strong enough for the pilot.")}${addressFields("survey-address", values.area || entry?.area || state.session.area || "")}</label>
        <label>${questionLabel("Needed a provider recently?", "Confirms whether the person actually experienced the problem KAILA wants to solve.")}${select("survey-needed", ["Yes", "No"], values.neededProvider || "Yes")}</label>
        <label>${questionLabel("Service needed", "Identifies which service categories have real local demand.")}${categorySelect("survey-service", true, values.serviceNeeded || entry?.category || "")}</label>
        <label>${questionLabel("How did they look?", "Shows current discovery behavior and what KAILA must improve or integrate with.")}${select("survey-search-method", ["Referral", "Facebook", "Messenger", "Neighbor", "Shop", "Previous provider", "Other"], values.searchMethod || "", "Choose method")}</label>
        <label>${questionLabel("How long did it take?", "Measures search friction and urgency. Longer search time is stronger evidence of pain.")}${select("survey-time-to-find", ["Same day", "1-2 days", "3-7 days", "More than a week", "Never found one"], values.timeToFind || "", "Choose time")}</label>
        <label>${questionLabel("Compared prices?", "Checks whether clients already want multiple offers or are stuck with one option.")}${select("survey-compared-prices", ["Yes", "No"], values.comparedPrices || "", "Choose")}</label>
        <label>${questionLabel("Price clear before job?", "Tests pricing transparency problems that KAILA can solve with offers and scope notes.")}${select("survey-price-clear", ["Yes", "No", "Somewhat"], values.priceClear || "", "Choose")}</label>
        <label>${questionLabel("Satisfied with work?", "Captures quality outcome and whether current alternatives are good enough.")}${select("survey-satisfaction", ["5 - Very satisfied", "4 - Satisfied", "3 - Neutral", "2 - Unsatisfied", "1 - Very unsatisfied", "Not applicable"], values.satisfaction || "", "Choose")}</label>
        <label>${questionLabel("Would post in KAILA?", "Direct willingness signal for demand validation. Probe why if the answer is No or Maybe.")}${select("survey-would-post", YES_NO_MAYBE_OPTIONS, values.wouldPostRequest || "Maybe")}</label>
        <label>${questionLabel("Would upload photos/videos?", "Tests comfort with giving providers evidence for better estimates.")}${select("survey-would-upload", YES_NO_MAYBE_OPTIONS, values.wouldUploadMedia || "Maybe")}</label>
        <label>${questionLabel("Would compare offers?", "Validates the marketplace comparison workflow.")}${select("survey-would-compare", YES_NO_MAYBE_OPTIONS, values.wouldCompareOffers || "Maybe")}</label>
        <label>${questionLabel("Would rate provider?", "Checks whether two-way trust and reputation can work in the pilot.")}${select("survey-would-rate", YES_NO_MAYBE_OPTIONS, values.wouldRateProvider || "Maybe")}</label>
        ${decisionSignalField("survey-signal", "client_survey", "Ops judgment after the conversation: does this response support, weaken, or block the pilot assumption?", values.decisionSignal || entry?.decisionSignal || "Neutral")}
        <label class="wide">${questionLabel("Hardest part", "Capture the pain point in the respondent's own words for decision-making and future copy.")}<textarea id="survey-hardest-part" class="form-control" rows="2">${escapeHtml(values.hardestPart || "")}</textarea></label>
        <label class="wide">${questionLabel("Trust factors", "Records what makes a provider credible to this client: referral, reviews, samples, ID, shop, price, etc.")}<textarea id="survey-trust-factors" class="form-control" rows="2" placeholder="Referral, reviews, work samples, ID, shop, price, etc.">${escapeHtml(values.trustFactors || "")}</textarea></label>
        <label class="wide">${questionLabel("Notes", "Use for context, exact quotes, objections, or follow-up details that do not fit elsewhere.")}<textarea id="survey-notes" class="form-control" rows="2">${escapeHtml(values.notes || entry?.notes || "")}</textarea></label>
      </div>
    `,
    confirmButtonText: isEdit ? "Save Changes" : "Save Survey",
    didOpen: () => {
      bindAddressGroup("survey-address");
      bindQuestionGuides();
      if (!isEdit) bindValidationDraft("client_survey");
      bindDecisionSignalSuggestion("client_survey");
    },
    preConfirm: () => {
      const responses = clientSurveyResponses();
      if (!responses.name || !responses.area || !responses.serviceNeeded) {
        window.Swal.showValidationMessage("Name or nickname, area, and service needed are required.");
        return false;
      }
      return {
        type: "client_survey",
        subjectName: responses.name,
        area: responses.area,
        category: responses.serviceNeeded,
        decisionSignal: responses.decisionSignal,
        notes: responses.notes,
        responses,
      };
    },
  });
  if (!result.isConfirmed) return;
  const saved = isEdit
    ? await updateValidationEntry(entry.id, result.value, "Client survey updated")
    : await saveValidationEntry(result.value, "Client survey saved");
  if (saved && !isEdit) clearValidationDraft("client_survey");
}

async function openProviderInterviewModal(entry = null) {
  const isEdit = Boolean(entry?.id);
  const values = entry?.responses || {};
  const result = await modal({
    title: isEdit ? "Edit Provider Interview" : "Provider Interview Form",
    html: `
      <div class="swal-form two">
        ${validationBriefer("provider_interview")}
        ${isEdit ? "" : validationDraftTools("provider_interview")}
        <label>${questionLabel("Provider name", "Identifies who was interviewed and allows Admin to connect answers to onboarding decisions.")}<input id="interview-name" class="form-control" maxlength="80" value="${escapeAttribute(values.providerName || entry?.subjectName || "")}"></label>
        <label>${questionLabel("Years of experience", "A trust and capability signal. Experience can matter even without formal certification.")}${select("interview-experience", EXPERIENCE_OPTIONS, values.yearsExperience || "", "Choose experience")}</label>
        <label class="wide">${questionLabel("Services offered", "Ask for exact jobs, not just a broad category, so matching is accurate.")}<textarea id="interview-services" class="form-control" rows="2">${escapeHtml(values.servicesOffered || entry?.category || "")}</textarea></label>
        <label>${questionLabel("How clients find them", "Shows current provider discovery channels and what KAILA must improve.")}${select("interview-client-source", ["Referral", "Facebook", "Shop walk-ins", "Repeat clients", "Other"], values.clientSource || "", "Choose source")}</label>
        <label>${questionLabel("Weekly jobs", "Supply-side baseline. Helps Admin see whether the provider is active, overloaded, or looking for work.")}<input id="interview-weekly-jobs" class="form-control" inputmode="numeric" maxlength="40" value="${escapeAttribute(values.weeklyJobs || "")}"></label>
        <label>${questionLabel("Wants more clients?", "Validates provider-side motivation. Ask why if the answer is No or Depends.")}${select("interview-wants-more", ["Yes", "No", "Depends"], values.wantsMoreClients || "Yes")}</label>
        <label class="wide">${questionLabel("Coverage area", "Defines where this provider can realistically accept requests and any travel limits or fees.")}<textarea id="interview-coverage" class="form-control" rows="2" placeholder="Barangays, city limits, travel fee rules">${escapeHtml(values.coverageArea || entry?.area || "")}</textarea></label>
        <label class="wide">${questionLabel("Most profitable jobs", "Helps prioritize categories and avoid sending low-value matches that providers ignore.")}<textarea id="interview-profitable" class="form-control" rows="2">${escapeHtml(values.profitableJobs || "")}</textarea></label>
        <label class="wide">${questionLabel("Jobs avoided", "Prevents poor matches and reduces disputes by learning what work they refuse.")}<textarea id="interview-avoid" class="form-control" rows="2">${escapeHtml(values.jobsAvoided || "")}</textarea></label>
        <label>${questionLabel("Can receive requests?", "Confirms which channel Ops should use during the manual pilot.")}${select("interview-request-channel", ["Messenger", "SMS", "Call", "Email", "Other"], values.requestChannel || "Messenger")}</label>
        <label>${questionLabel("Comfortable submitting offers?", "Tests whether providers will participate in KAILA's quote/offer workflow.")}${select("interview-offers", YES_NO_MAYBE_OPTIONS, values.comfortableSubmittingOffers || "Maybe")}</label>
        <label class="wide">${questionLabel("How they estimate price", "Captures pricing logic: inspection fee, fixed fee, parts and labor, or scope-based estimate.")}<textarea id="interview-price-estimate" class="form-control" rows="2" placeholder="Inspection fee, fixed fee, parts/labor, scope-based">${escapeHtml(values.priceEstimateMethod || "")}</textarea></label>
        <label class="wide">${questionLabel("Difficult client signals", "Helps define client reminders and operational rules that protect providers.")}<textarea id="interview-difficult-client" class="form-control" rows="2">${escapeHtml(values.difficultClientSignals || "")}</textarea></label>
        <label class="wide">${questionLabel("Acceptable verification", "Finds verification steps providers consider fair: ID, samples, references, certificate, shop photo, or pilot history.")}<textarea id="interview-verification" class="form-control" rows="2" placeholder="ID, work samples, references, certificate, shop photo, pilot job history">${escapeHtml(values.acceptableVerification || "")}</textarea></label>
        <label class="wide">${questionLabel("Rating concerns", "Surfaces fears about unfair reviews, public complaints, or client abuse before the trust system launches.")}<textarea id="interview-rating-concerns" class="form-control" rows="2">${escapeHtml(values.ratingConcerns || "")}</textarea></label>
        <label class="wide">${questionLabel("What makes KAILA valuable?", "Captures provider value propositions: more jobs, better clients, visibility, trust badges, performance summary.")}<textarea id="interview-value" class="form-control" rows="2">${escapeHtml(values.kailaValue || "")}</textarea></label>
        <label class="wide">${questionLabel("Provider referrals", "Asks whether they can recommend other reliable providers to build supply faster.")}<textarea id="interview-referrals" class="form-control" rows="2">${escapeHtml(values.providerReferrals || "")}</textarea></label>
        ${decisionSignalField("interview-signal", "provider_interview", "Ops judgment after the interview: does this provider strengthen, weaken, or block supply validation?", values.decisionSignal || entry?.decisionSignal || "Neutral")}
        <label class="wide">${questionLabel("Notes", "Use for exact quotes, objections, category insights, or follow-up tasks.")}<textarea id="interview-notes" class="form-control" rows="2">${escapeHtml(values.notes || entry?.notes || "")}</textarea></label>
      </div>
    `,
    confirmButtonText: isEdit ? "Save Changes" : "Save Interview",
    didOpen: () => {
      bindQuestionGuides();
      if (!isEdit) bindValidationDraft("provider_interview");
      bindDecisionSignalSuggestion("provider_interview");
    },
    preConfirm: () => {
      const responses = providerInterviewResponses();
      if (!responses.providerName || !responses.servicesOffered || !responses.coverageArea) {
        window.Swal.showValidationMessage("Provider name, services offered, and coverage area are required.");
        return false;
      }
      return {
        type: "provider_interview",
        subjectName: responses.providerName,
        area: responses.coverageArea,
        category: responses.servicesOffered,
        decisionSignal: responses.decisionSignal,
        notes: responses.notes,
        responses,
      };
    },
  });
  if (!result.isConfirmed) return;
  const saved = isEdit
    ? await updateValidationEntry(entry.id, result.value, "Provider interview updated")
    : await saveValidationEntry(result.value, "Provider interview saved");
  if (saved && !isEdit) clearValidationDraft("provider_interview");
}

async function saveValidationEntry(payload, title) {
  try {
    const response = await apiFetch("/api/validation", { method: "POST", body: JSON.stringify(payload) });
    safeApplyState(response.state);
    activateTab("#validation-pane");
    notify(title, "Validation evidence is now in the Ops tracker.", "success");
    return true;
  } catch (error) {
    if (error.offline) {
      queueValidationEntry(payload);
      activateTab("#validation-pane");
      notify("Saved offline", "This entry is stored on this device and will sync automatically when online.", "info");
      return true;
    }
    notify("Validation entry failed", error.message, "error");
    return false;
  }
}

function openValidationEditModal(entry) {
  if (entry.type === "client_survey") {
    openClientSurveyModal(entry);
    return;
  }
  openProviderInterviewModal(entry);
}

async function updateValidationEntry(entryId, payload, title) {
  try {
    const response = await apiFetch(`/api/validation/${encodeURIComponent(entryId)}`, { method: "PUT", body: JSON.stringify(payload) });
    safeApplyState(response.state);
    activateTab("#validation-pane");
    notify(title, "Validation evidence has been updated.", "success");
    return true;
  } catch (error) {
    notify("Validation update failed", error.message, "error");
    return false;
  }
}

async function deleteValidationEntry(entryId) {
  if (state.session?.role !== "admin") return;
  const entry = state.validationEntries.find((item) => item.id === entryId);
  if (!entry) return;
  const result = await window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    icon: "warning",
    title: "Delete validation entry?",
    text: `${entry.subjectName || "This entry"} will be removed from the Ops tracker.`,
    showCancelButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#dc3545",
    reverseButtons: true,
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch(`/api/validation/${encodeURIComponent(entryId)}`, { method: "DELETE" });
    safeApplyState(response.state);
    activateTab("#validation-pane");
    notify("Validation entry deleted", "The entry was removed from the Ops tracker.", "success");
  } catch (error) {
    notify("Delete failed", error.message, "error");
  }
}

function cacheStateSnapshot() {
  const snapshot = {
    users: state.users,
    providers: state.providers,
    requests: state.requests,
    validationEntries: (state.validationEntries || []).filter((entry) => !entry.pendingSync),
    activities: state.activity,
    cachedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE.stateSnapshot, JSON.stringify(snapshot));
}

function currentValidationQueue() {
  const queue = readJson(STORAGE.validationQueue, []);
  if (!Array.isArray(queue)) return [];
  return queue.filter((item) => item?.payload && item?.clientId);
}

function writeValidationQueue(queue) {
  localStorage.setItem(STORAGE.validationQueue, JSON.stringify(queue));
  renderConnectivity();
}

function offlineQueueSummary() {
  const validation = currentValidationQueue()
    .filter((item) => !state.session?.id || item.userId === state.session.id)
    .length;
  return {
    validation,
    total: validation,
  };
}

function queueValidationEntry(payload) {
  const item = {
    clientId: `offline-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: state.session?.id || null,
    operatorName: state.session?.name || "Ops",
    payload,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  const queue = [...currentValidationQueue(), item];
  writeValidationQueue(queue);
  state.validationEntries = mergeQueuedValidationEntries((state.validationEntries || []).filter((entry) => !entry.pendingSync));
  renderValidation();
  renderOps();
}

function mergeQueuedValidationEntries(entries = []) {
  const serverEntries = (entries || []).filter((entry) => !entry.pendingSync);
  const queuedEntries = currentValidationQueue()
    .filter((item) => !state.session?.id || item.userId === state.session.id)
    .map(queuedValidationEntry);
  return [...queuedEntries, ...serverEntries];
}

function queuedValidationEntry(item) {
  const payload = item.payload || {};
  return {
    id: item.clientId,
    type: payload.type,
    operatorId: item.userId,
    operatorName: item.operatorName || "Ops",
    subjectName: payload.subjectName || "Unsynced entry",
    area: payload.area || "",
    category: payload.category || "",
    decisionSignal: payload.decisionSignal || "",
    responses: payload.responses || {},
    notes: payload.notes || "",
    createdAt: item.createdAt,
    pendingSync: true,
  };
}

async function syncQueuedValidationEntries() {
  if (state.validationSyncing || !state.session?.id || !navigator.onLine) return;
  let queue = currentValidationQueue();
  const currentUserQueue = queue.filter((item) => item.userId === state.session.id);
  if (!currentUserQueue.length) return;

  state.validationSyncing = true;
  let synced = 0;
  for (const item of currentUserQueue) {
    try {
      const response = await apiFetch("/api/validation", { method: "POST", body: JSON.stringify(item.payload) });
      queue = queue.filter((queued) => queued.clientId !== item.clientId);
      writeValidationQueue(queue);
      synced += 1;
      safeApplyState(response.state);
    } catch (error) {
      item.attempts = (item.attempts || 0) + 1;
      queue = queue.map((queued) => queued.clientId === item.clientId ? item : queued);
      writeValidationQueue(queue);
      if (!error.offline) notify("Sync paused", error.message, "warning");
      break;
    }
  }
  state.validationSyncing = false;
  state.validationEntries = mergeQueuedValidationEntries((state.validationEntries || []).filter((entry) => !entry.pendingSync));
  renderValidation();
  renderOps();
  if (synced) notify("Offline entries synced", `${synced} validation entr${synced === 1 ? "y" : "ies"} uploaded.`, "success");
}

function fieldValue(selector) {
  return String($(selector)?.value || "").trim();
}

function clientSurveyResponses() {
  return {
    name: fieldValue("#survey-name"),
    ageRange: fieldValue("#survey-age"),
    area: addressValue("survey-address"),
    neededProvider: fieldValue("#survey-needed"),
    serviceNeeded: fieldValue("#survey-service"),
    searchMethod: fieldValue("#survey-search-method"),
    timeToFind: fieldValue("#survey-time-to-find"),
    hardestPart: fieldValue("#survey-hardest-part"),
    comparedPrices: fieldValue("#survey-compared-prices"),
    priceClear: fieldValue("#survey-price-clear"),
    trustFactors: fieldValue("#survey-trust-factors"),
    satisfaction: fieldValue("#survey-satisfaction"),
    wouldPostRequest: fieldValue("#survey-would-post"),
    wouldUploadMedia: fieldValue("#survey-would-upload"),
    wouldCompareOffers: fieldValue("#survey-would-compare"),
    wouldRateProvider: fieldValue("#survey-would-rate"),
    decisionSignal: fieldValue("#survey-signal"),
    notes: fieldValue("#survey-notes"),
  };
}

function providerInterviewResponses() {
  return {
    providerName: fieldValue("#interview-name"),
    servicesOffered: fieldValue("#interview-services"),
    yearsExperience: fieldValue("#interview-experience"),
    clientSource: fieldValue("#interview-client-source"),
    weeklyJobs: fieldValue("#interview-weekly-jobs"),
    wantsMoreClients: fieldValue("#interview-wants-more"),
    coverageArea: fieldValue("#interview-coverage"),
    profitableJobs: fieldValue("#interview-profitable"),
    jobsAvoided: fieldValue("#interview-avoid"),
    requestChannel: fieldValue("#interview-request-channel"),
    comfortableSubmittingOffers: fieldValue("#interview-offers"),
    priceEstimateMethod: fieldValue("#interview-price-estimate"),
    difficultClientSignals: fieldValue("#interview-difficult-client"),
    acceptableVerification: fieldValue("#interview-verification"),
    ratingConcerns: fieldValue("#interview-rating-concerns"),
    kailaValue: fieldValue("#interview-value"),
    providerReferrals: fieldValue("#interview-referrals"),
    decisionSignal: fieldValue("#interview-signal"),
    notes: fieldValue("#interview-notes"),
  };
}

function questionLabel(text, guide) {
  return `
    <span class="question-label">
      <span>${escapeHtml(text)}</span>
      <span class="question-help" tabindex="0" role="button" aria-label="${escapeAttribute(`${text}: ${guide}`)}" data-guide="${escapeAttribute(guide)}">?</span>
    </span>
  `;
}

function decisionSignalField(id, type, guide, selected = "Neutral") {
  return `
    <label data-decision-signal-field="${escapeAttribute(type)}">
      ${questionLabel("Decision signal", guide)}
      <div class="decision-signal-row">
        ${select(id, DECISION_SIGNAL_OPTIONS, selected || "Neutral")}
        <button class="btn btn-outline-primary btn-sm" type="button" data-suggest-decision-signal="${escapeAttribute(type)}">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>AI Prefill</span>
        </button>
      </div>
      <small class="decision-signal-note" data-decision-signal-note></small>
    </label>
  `;
}

function bindDecisionSignalSuggestion(type) {
  const popup = window.Swal?.getPopup();
  if (!popup) return;
  const button = $(`[data-suggest-decision-signal="${escapeCssIdentifier(type)}"]`, popup);
  const note = $(`[data-decision-signal-field="${escapeCssIdentifier(type)}"] [data-decision-signal-note]`, popup);
  const signalId = type === "provider_interview" ? "interview-signal" : "survey-signal";
  const collect = type === "provider_interview" ? providerInterviewResponses : clientSurveyResponses;
  button?.addEventListener("click", async () => {
    const signal = $(`#${signalId}`, popup);
    if (!signal) return;
    button.disabled = true;
    const previousHtml = button.innerHTML;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Thinking</span>`;
    if (note) note.textContent = "AI is reviewing the current answers.";
    try {
      const payload = await apiFetch("/api/validation/decision-signal", {
        method: "POST",
        body: JSON.stringify({ type, responses: collect() }),
      });
      signal.value = payload.decisionSignal || "Neutral";
      signal.dispatchEvent(new Event("change", { bubbles: true }));
      saveValidationDraft(type, popup);
      if (note) note.textContent = payload.reason || "Decision signal suggested by AI.";
    } catch (error) {
      if (note) note.textContent = "";
      notify("AI prefill failed", error.message, "error");
    } finally {
      button.disabled = false;
      button.innerHTML = previousHtml;
    }
  });
}

function validationDraftTools(type) {
  return `
    <div class="validation-draft-tools wide">
      <span>Draft auto-saves on this device until saved or cleared.</span>
      <button class="btn btn-outline-danger btn-sm" type="button" data-clear-validation-draft="${escapeAttribute(type)}">Clear Form</button>
    </div>
  `;
}

function validationDraftKey(type) {
  return type === "client_survey" ? STORAGE.clientSurveyDraft : STORAGE.providerInterviewDraft;
}

function bindValidationDraft(type) {
  const popup = window.Swal?.getPopup();
  if (!popup) return;
  restoreValidationDraft(type, popup);
  let draftSavingPaused = false;
  const save = () => {
    if (!draftSavingPaused) saveValidationDraft(type, popup);
  };
  $$("input, select, textarea", popup).forEach((field) => {
    field.addEventListener("input", save);
    field.addEventListener("change", save);
  });
  $(`[data-clear-validation-draft="${escapeCssIdentifier(type)}"]`, popup)?.addEventListener("click", () => {
    if (!window.confirm("Clear this form and discard the current unsaved entries on this device?")) return;
    draftSavingPaused = true;
    clearValidationDraft(type);
    resetValidationDraftFields(popup);
    draftSavingPaused = false;
    notify("Form cleared", "The unsaved draft has been discarded.", "success");
  });
}

function saveValidationDraft(type, scope = document) {
  const values = {};
  $$("input, select, textarea", scope).forEach((field) => {
    if (!field.id || field.type === "file" || field.type === "button" || field.type === "submit") return;
    values[field.id] = field.value;
  });
  localStorage.setItem(validationDraftKey(type), JSON.stringify(values));
}

function restoreValidationDraft(type, scope = document) {
  const draft = readJson(validationDraftKey(type), null);
  if (!draft || typeof draft !== "object") return;
  Object.entries(draft).forEach(([id, value]) => {
    const field = $(`#${escapeCssIdentifier(id)}`, scope);
    if (field) field.value = value;
  });
}

function resetValidationDraftFields(scope = document) {
  $$("input, select, textarea", scope).forEach((field) => {
    if (!field.id || field.type === "file" || field.type === "button" || field.type === "submit") return;
    if (field.tagName === "SELECT") {
      field.selectedIndex = field.querySelector("option[selected]")?.index ?? 0;
    } else {
      field.value = field.defaultValue || "";
    }
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function clearValidationDraft(type) {
  localStorage.removeItem(validationDraftKey(type));
}

function validationBriefer(type) {
  if (type === "client_survey") {
    return `
      <details class="validation-briefer wide" open>
        <summary>Survey briefer for staff</summary>
        <div class="briefer-body">
          <p><strong>Purpose:</strong> This survey checks whether residents really struggle to find trusted local service providers, how they currently search, and whether they would use KAILA's request-and-offer flow.</p>
          <p><strong>Suggested intro:</strong> "We are validating KAILA, a local pilot that may help people find trusted service providers faster. This is not a sales call. We only want to understand your recent experience finding help."</p>
          <p><strong>Explain privacy:</strong> A nickname is acceptable. Do not collect sensitive details that are not needed. Tell the respondent their answers are for pilot matching and decision-making only.</p>
          <p><strong>How to ask:</strong> Stay neutral. Do not lead them toward positive answers. If they answer Maybe or No, ask what would need to change. Capture exact words when they describe pain points.</p>
          <p><strong>What to listen for:</strong> hard-to-find services, slow response, unclear price, lack of trust, willingness to upload photos, willingness to compare offers, and willingness to rate after completion.</p>
          <p><strong>Decision signal:</strong> Mark Strong positive or Positive only when the answer supports real demand. Mark Concern or Blocker when trust, privacy, pricing, or behavior makes adoption unlikely.</p>
        </div>
      </details>
    `;
  }
  return `
    <details class="validation-briefer wide" open>
      <summary>Interview briefer for staff</summary>
      <div class="briefer-body">
        <p><strong>Purpose:</strong> This interview checks whether providers are willing and able to join a local request-matching pilot, respond to leads, submit offers, accept ratings, and follow basic rules.</p>
        <p><strong>Suggested intro:</strong> "We are validating KAILA, a free local pilot that may help skilled providers become easier to find. We want to understand your services, coverage, pricing habits, and concerns before inviting providers into the pilot."</p>
        <p><strong>Explain expectations:</strong> Providers are independent workers or businesses. Joining the pilot does not guarantee jobs. KAILA will use the answers to match requests better and decide which categories are ready.</p>
        <p><strong>How to ask:</strong> Ask for specific jobs, not just broad categories. Probe gently on pricing, availability, travel limits, and client problems. Do not promise payment volume, ranking, or certification.</p>
        <p><strong>What to listen for:</strong> active work history, clear services, reliable communication, realistic coverage, fair pricing habits, comfort with offers, acceptable verification steps, and openness to ratings.</p>
        <p><strong>Decision signal:</strong> Mark Strong positive or Positive when the provider is capable, responsive, and willing to participate. Mark Concern or Blocker for unclear services, refusal to be rated, unreliable communication, or high dispute risk.</p>
      </div>
    </details>
  `;
}

function bindQuestionGuides() {
  $$("[data-guide]", window.Swal?.getPopup() || document).forEach((button) => {
    const place = () => placeQuestionGuide(button);
    button.addEventListener("mouseenter", place);
    button.addEventListener("focus", place);
    button.addEventListener("touchstart", place, { passive: true });
  });
}

function placeQuestionGuide(button) {
  const rect = button.getBoundingClientRect();
  const container = button.closest(".swal2-popup")?.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const bounds = container || { left: 0, right: viewportWidth, top: 0 };
  const tooltipWidth = Math.min(272, Math.max(180, Math.min(viewportWidth - 32, bounds.right - bounds.left - 32)));
  const center = rect.left + rect.width / 2;
  let placement = "center";
  if (center - tooltipWidth / 2 < bounds.left + 16) placement = "left";
  if (center + tooltipWidth / 2 > bounds.right - 16) placement = "right";
  button.dataset.placement = placement;
  button.dataset.vertical = rect.top - 96 < bounds.top + 16 ? "below" : "above";
}

async function openRequestModal() {
  const result = await modal({
    title: "Post request",
    html: `
      <div class="swal-form two">
        <label><span>Category</span>${categorySelect("request-category", true)}</label>
        <label><span>Urgency</span>${select("request-urgency", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Preferred schedule</span>${select("request-schedule", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Contact method</span>${select("request-contact-method", CONTACT_CHANNELS, state.session.preferredContactChannel || "Messenger")}</label>
        <label class="wide"><span>Address</span>${addressFields("request-address", state.session.area)}</label>
        <label><span>Budget</span><input id="request-budget" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Open / ₱1,500.00"></label>
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
    width: "min(96vw, 1040px)",
    customClass: { popup: "profile-popup" },
    title: existing ? "Update provider" : "Provider profile",
    html: `
      <div class="swal-form two">
        <label><span>Display name</span><input id="provider-display-name" class="form-control" value="${escapeAttribute(existing?.displayName || state.session.name || "")}"></label>
        <label><span>Provider type</span>${select("provider-type", PROVIDER_TYPES, existing?.providerType || "Individual")}</label>
        <label class="wide"><span>Categories</span>${categoryChips("provider-category", existing?.category || state.session.category)}</label>
        <label class="wide"><span>Address</span>${addressFields("provider-address", existing?.area || state.session.area || "")}</label>
        <label><span>Availability</span>${select("provider-availability", AVAILABILITY_OPTIONS, existing?.availability || "Today")}</label>
        <label><span>Experience</span>${select("provider-experience", EXPERIENCE_OPTIONS, existing?.yearsExperience || "1-2")}</label>
        <label><span>Emergency availability</span>${select("provider-emergency", EMERGENCY_OPTIONS, existing?.emergencyAvailability || "Sometimes")}</label>
        <label><span>Available days</span>${availableDaysChips("provider-days", existing?.availableDays || "")}</label>
        <label><span>Available time</span>${timeRangeFields("provider-time", existing?.availableTime || "")}</label>
        <label class="wide"><span>Specific services</span><textarea id="provider-services" class="form-control" rows="3">${escapeHtml(existing?.specificServices || existing?.skills || "")}</textarea></label>
        <label class="wide"><span>Coverage area</span>${coverageAreaChips("provider-coverage", existing?.coverageArea || "")}</label>
        <label class="wide"><span>Travel limits</span><textarea id="provider-travel" class="form-control" rows="2">${escapeHtml(existing?.travelLimits || "")}</textarea></label>
        <label><span>Minimum fee</span><input id="provider-minimum-fee" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeAttribute(currencyInputValue(existing?.minimumFee || ""))}" placeholder="300"></label>
        <label><span>Price range</span>${priceRangeFields("provider-price-range", existing?.priceRange || "")}</label>
        <label class="wide"><span>Work sample link</span><input id="provider-work-samples" class="form-control" inputmode="url" value="${escapeAttribute(existing?.workSamples || "")}"></label>
        <label class="wide"><span>Certificate / permit link</span><input id="provider-certificate" class="form-control" inputmode="url" value="${escapeAttribute(existing?.certificateProof || "")}"></label>
        <label class="wide consent-line"><input id="provider-valid-id" type="checkbox" ${existing?.validIdConsent ? "checked" : ""}> Optional ID may be used for verification.</label>
        <label class="wide consent-line"><input id="provider-consent-requests" type="checkbox" ${existing?.consentRequests ? "checked" : ""}> I agree to receive pilot job requests.</label>
        <label class="wide consent-line"><input id="provider-consent-ratings" type="checkbox" ${existing?.consentRatings ? "checked" : ""}> I agree to receive ratings.</label>
        <label class="wide consent-line"><input id="provider-rules" type="checkbox" ${existing?.rulesAgreement ? "checked" : ""}> I understand and agree to provider rules.</label>
      </div>
    `,
    confirmButtonText: "Save",
    didOpen: () => {
      bindCategoryChips("provider-category");
      bindCategoryChips("provider-days");
      bindCategoryChips("provider-coverage");
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
        coverageArea: selectedCategoryChips("provider-coverage").join(", "),
        emergencyAvailability: $("#provider-emergency").value,
        availableDays: selectedCategoryChips("provider-days").join(", "),
        availableTime: timeRangeValue("#provider-time-start", "#provider-time-end"),
        travelLimits: $("#provider-travel").value.trim(),
        minimumFee: normalizeCurrencyInput($("#provider-minimum-fee").value),
        priceRange: priceRangeValue("#provider-price-range-min", "#provider-price-range-max"),
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
        <label><span>Amount</span><input id="offer-amount" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" placeholder="₱1,500.00"></label>
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
  clearUnreadMessage("job", requestId);
  state.activeConversationId = requestId;
  await setConversationPresence(requestId, true);
  const payload = await fetchConversation(requestId);
  if (!payload) {
    setConversationPresence(requestId, false);
    return;
  }
  markConversationRead("job", requestId, payload.messages);

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
    ? messages.map((message) => renderChatMessage(message, { writable, reactions: true })).join("")
    : `<p class="chat-empty">No messages yet.</p>`;

  return `
    <div class="chat-shell">
      ${conversationIdentityHtml(request)}
      ${writable && state.session?.role !== SUPPORT_ROLE ? `
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
        <div class="chat-compose direct-chat-compose">
          <textarea class="form-control" rows="2" maxlength="2000" placeholder="Write a message" data-chat-input></textarea>
          <label class="btn btn-outline-secondary direct-media-button" title="Attach photos or videos">
            <i class="fa-solid fa-paperclip"></i>
            <input type="file" data-chat-attachments accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden>
          </label>
          <button class="btn btn-primary" type="button" data-chat-send>Send</button>
        </div>
        <div class="upload-preview direct-upload-preview" data-chat-attachment-preview></div>
      ` : `<div class="chat-archived">Conversation archived after job completion.</div>`}
    </div>
  `;
}

function renderChatMessage(message = {}, { writable = false, reactions = false } = {}) {
  if (message.kind === "call") return renderCallLogMessage(message);
  const reactionCount = Array.isArray(message.reactions) ? message.reactions.length : 0;
  return `
    <div class="chat-message ${message.senderId === state.session.id ? "mine" : ""}">
      <strong>${escapeHtml(chatMessageSenderName(message))}</strong>
      <span>${escapeHtml(formatDateTime(message.createdAt))}</span>
      ${message.detail ? `<p>${escapeHtml(message.detail)}</p>` : ""}
      ${renderDirectMessageAttachments(message.attachments)}
      ${reactions ? (writable ? `<button class="chat-reaction" type="button" data-chat-react="${message.id}">Like${reactionCount ? ` ${reactionCount}` : ""}</button>` : reactionCount ? `<span class="chat-reaction-count">Liked ${reactionCount}</span>` : "") : ""}
    </div>
  `;
}

function chatMessageSenderName(message = {}) {
  const sender = userProfile(message.senderId);
  if (sender.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session?.role)) return "KAILA Customer Service";
  return message.senderName || sender.name || "KAILA user";
}

function renderDirectMessageAttachments(attachments = []) {
  if (!attachments?.length) return "";
  return `
    <div class="media-grid direct-message-media">
      ${attachments.map((attachment, index) => {
        const url = `${apiBase()}${attachment.url}`;
        const isVideo = attachment.mimeType?.startsWith("video/");
        return `
          <button class="media-tile" type="button" data-direct-media-open="${index}" data-direct-media-items="${escapeAttribute(JSON.stringify(attachments))}">
            ${isVideo
              ? `<video muted preload="metadata" src="${escapeAttribute(url)}"></video><span class="media-type">Video</span>`
              : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(attachment.originalName)}"><span class="media-type">Photo</span>`}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderCallLogMessage(message = {}) {
  const call = message.call || {};
  const outgoing = call.callerId === state.session?.id || (!call.callerId && message.senderId === state.session?.id);
  const missed = call.status === "missed" || call.status === "declined";
  const callType = call.callType === "video" ? "video" : "audio";
  const direction = outgoing ? "Outgoing" : "Incoming";
  const title = missed ? `${outgoing ? "Outgoing" : "Missed incoming"} ${callType} call` : `${direction} ${callType} call`;
  const duration = missed ? "No answer" : `Duration ${formatDurationSeconds(call.durationSeconds || 0)}`;
  const icon = callType === "video" ? "fa-video" : missed ? "fa-phone-slash" : "fa-phone";
  return `
    <div class="chat-message chat-call-log ${outgoing ? "mine" : ""} ${missed ? "missed" : ""}">
      <i class="fa-solid ${icon}"></i>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(formatDateTime(message.createdAt))} - ${escapeHtml(duration)}</span>
      </div>
    </div>
  `;
}

function formatDurationSeconds(value = 0) {
  const seconds = Math.max(0, Number(value) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
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
  startConversationPolling(requestId);
  const popup = window.Swal.getPopup?.() || document;
  $$("[data-direct-media-open]", popup).forEach((button) => {
    button.addEventListener("click", () => {
      const attachments = readJsonFromString(button.dataset.directMediaItems, []);
      openDirectMediaViewer(attachments, Number(button.dataset.directMediaOpen || 0));
    });
  });
  $("[data-audio-call]")?.addEventListener("click", () => startAudioCall(requestId));
  $("[data-video-call]")?.addEventListener("click", () => startVideoCall(requestId));
  if (!writable) return;
  const input = $("[data-chat-input]");
  $("[data-chat-send]")?.addEventListener("click", () => sendConversationMessage(requestId));
  bindAttachmentPreview("[data-chat-attachments]", "[data-chat-attachment-preview]", 3);
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
  const attachmentInput = $("[data-chat-attachments]");
  const detail = input?.value.trim();
  const attachments = await readMediaAttachments("[data-chat-attachments]");
  if (!attachments) return;
  if (!detail && !attachments.length) return;
  state.conversationDraftVersion += 1;
  input.value = "";
  if (attachmentInput) attachmentInput.value = "";
  stopConversationTyping(requestId);
  try {
    await apiFetch(`/api/requests/${requestId}/messages`, { method: "POST", body: JSON.stringify({ detail, attachments }) });
    await refreshConversation(requestId, { force: true });
  } catch (error) {
    notify("Message failed", error.message, "error");
  }
}

async function refreshConversation(requestId, options = {}) {
  if (state.activeConversationId !== requestId || !window.Swal.isVisible()) return;
  const draftVersion = state.conversationDraftVersion;
  const input = $("[data-chat-input]");
  const draft = input?.value || "";
  if (!options.force && hasComposerDraft("[data-chat-input]", "[data-chat-attachments]")) return;
  const selectionStart = input?.selectionStart || 0;
  const selectionEnd = input?.selectionEnd || 0;
  const restoreFocus = document.activeElement === input;
  const payload = await fetchConversation(requestId);
  const shell = $(".chat-shell");
  if (!payload || !shell) return;
  markConversationRead("job", requestId, payload.messages);
  const request = state.requests.find((item) => item.id === requestId);
  shell.outerHTML = conversationHtml(payload.messages, payload.writable, payload.activeUserIds, request);
  bindConversationInput(requestId, payload.writable);
  const nextInput = $("[data-chat-input]");
  if (nextInput) {
    const shouldRestoreDraft = draftVersion === state.conversationDraftVersion;
    nextInput.value = shouldRestoreDraft ? draft : "";
    if (shouldRestoreDraft) nextInput.setSelectionRange(selectionStart, selectionEnd);
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
    await refreshConversation(requestId, { force: true });
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
  stopConversationPolling();
  stopConversationTyping(requestId);
  setConversationPresence(requestId, false);
}

function startConversationPolling(requestId) {
  stopConversationPolling();
  state.conversationPollTimer = setInterval(() => refreshConversation(requestId, { preserveScroll: true }), state.connected ? 5000 : 2500);
}

function stopConversationPolling() {
  clearInterval(state.conversationPollTimer);
  state.conversationPollTimer = null;
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

async function openDirectConversation(userId, requestId = "") {
  const target = userProfile(userId);
  if (!canViewDirectContact(target)) return;
  clearUnreadMessage("direct", directConversationMessageKey(userId, requestId));
  state.activeDirectConversationUserId = userId;
  state.activeDirectConversationRequestId = requestId || "";
  await setDirectConversationPresence(userId, true);
  const payload = await fetchDirectConversation(userId, requestId);
  if (!payload) {
    setDirectConversationPresence(userId, false);
    return;
  }
  markConversationRead("direct", directConversationMessageKey(userId, requestId), payload.messages);

  await window.Swal.fire({
    customClass: { popup: "kaila-popup chat-popup" },
    title: directConversationTitle(target, payload.requestContext),
    html: directConversationHtml(payload.messages, payload.writable, payload.activeUserIds, payload.target || target, payload.requestContext),
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => bindDirectConversationInput(userId, payload.writable, requestId),
    willClose: () => closeDirectConversationRoom(userId),
  });
  state.activeDirectConversationUserId = null;
  state.activeDirectConversationRequestId = "";
}

async function fetchDirectConversation(userId, requestId = "") {
  try {
    const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "";
    return await apiFetch(`/api/direct-conversations/${userId}/messages${query}`, { method: "GET" });
  } catch (error) {
    notify("Messages failed", error.message, "error");
    state.activeDirectConversationUserId = null;
    state.activeDirectConversationRequestId = "";
    return null;
  }
}

function directConversationHtml(messages, writable, activeUserIds = [], target = {}, requestContext = null) {
  const transcript = messages.length
    ? messages.map((message) => renderChatMessage(message)).join("")
    : `<p class="chat-empty">No messages yet.</p>`;
  const displayTarget = directConversationDisplayTarget(target);

  return `
    <div class="chat-shell">
      <div class="chat-reputation">${renderIdentity(displayTarget.name || "Direct contact", displayTarget.photoUrl, `${roleLabel(displayTarget.role || "user")} account`, displayTarget.reputation, "compact")}</div>
      ${requestContext ? directConversationTopicHtml(requestContext) : ""}
      ${canDirectCall(target) ? `
        <div class="chat-call-row">
          <span>${escapeHtml(roleLabel(displayTarget.role || "contact"))} direct line</span>
          <div class="chat-call-actions">
            <button class="btn btn-sm btn-outline-primary" type="button" data-direct-audio-call="${target.id || ""}">
              <i class="fa-solid fa-phone"></i> Audio Call
            </button>
            <button class="btn btn-sm btn-outline-primary" type="button" data-direct-video-call="${target.id || ""}">
              <i class="fa-solid fa-video"></i> Video Call
            </button>
          </div>
        </div>
      ` : ""}
      <div class="chat-presence" data-direct-chat-presence>${conversationPresenceText(activeUserIds)}</div>
      <div class="chat-transcript" data-chat-transcript>${transcript}</div>
      ${writable ? `
        <div class="chat-compose direct-chat-compose">
          <textarea class="form-control" rows="2" maxlength="2000" placeholder="Write a message" data-direct-chat-input></textarea>
          <label class="btn btn-outline-secondary direct-media-button" title="Attach photos or videos">
            <i class="fa-solid fa-paperclip"></i>
            <input type="file" data-direct-chat-attachments accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden>
          </label>
          <button class="btn btn-primary" type="button" data-direct-chat-send>Send</button>
        </div>
        <div class="upload-preview direct-upload-preview" data-direct-chat-attachment-preview></div>
      ` : `<div class="chat-archived">This direct conversation is read-only.</div>`}
    </div>
  `;
}

function bindDirectConversationInput(userId, writable, requestId = "") {
  scrollConversationToBottom();
  startDirectConversationPolling(userId);
  const popup = window.Swal.getPopup?.() || document;
  $$("[data-direct-media-open]", popup).forEach((button) => {
    button.addEventListener("click", () => {
      const attachments = readJsonFromString(button.dataset.directMediaItems, []);
      openDirectMediaViewer(attachments, Number(button.dataset.directMediaOpen || 0));
    });
  });
  $("[data-direct-audio-call]", popup)?.addEventListener("click", () => startDirectAudioCall(userId));
  $("[data-direct-video-call]", popup)?.addEventListener("click", () => startDirectVideoCall(userId));
  if (!writable) return;
  const input = $("[data-direct-chat-input]");
  $("[data-direct-chat-send]")?.addEventListener("click", () => sendDirectConversationMessage(userId, requestId));
  bindAttachmentPreview("[data-direct-chat-attachments]", "[data-direct-chat-attachment-preview]", 3);
  input?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendDirectConversationMessage(userId, requestId);
  });
}

async function openDirectMediaViewer(attachments = [], startIndex = 0) {
  if (!attachments?.length) return;
  let index = Math.max(0, Math.min(startIndex, attachments.length - 1));
  while (index >= 0 && index < attachments.length) {
    const attachment = attachments[index];
    const url = `${apiBase()}${attachment.url}`;
    const isVideo = attachment.mimeType?.startsWith("video/");
    const result = await window.Swal.fire({
      customClass: { popup: "kaila-popup media-popup" },
      title: "Message media",
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

async function sendDirectConversationMessage(userId, requestId = "") {
  const input = $("[data-direct-chat-input]");
  const attachmentInput = $("[data-direct-chat-attachments]");
  const detail = input?.value.trim();
  const attachments = await readMediaAttachments("[data-direct-chat-attachments]");
  if (!attachments) return;
  if (!detail && !attachments.length) return;
  state.directConversationDraftVersion += 1;
  input.value = "";
  if (attachmentInput) attachmentInput.value = "";
  try {
    const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "";
    await apiFetch(`/api/direct-conversations/${userId}/messages${query}`, { method: "POST", body: JSON.stringify({ detail, attachments }) });
    await refreshDirectConversation(userId, { force: true, requestId });
  } catch (error) {
    notify("Message failed", error.message, "error");
  }
}

async function refreshDirectConversation(userId, options = {}) {
  const requestId = options.requestId ?? state.activeDirectConversationRequestId ?? "";
  if (state.activeDirectConversationUserId !== userId || state.activeDirectConversationRequestId !== requestId || !window.Swal.isVisible()) return;
  const draftVersion = state.directConversationDraftVersion;
  const input = $("[data-direct-chat-input]");
  const draft = input?.value || "";
  if (!options.force && hasComposerDraft("[data-direct-chat-input]", "[data-direct-chat-attachments]")) return;
  const restoreFocus = document.activeElement === input;
  const payload = await fetchDirectConversation(userId, requestId);
  const shell = $(".chat-shell");
  if (!payload || !shell) return;
  markConversationRead("direct", directConversationMessageKey(userId, requestId), payload.messages);
  shell.outerHTML = directConversationHtml(payload.messages, payload.writable, payload.activeUserIds, payload.target || userProfile(userId), payload.requestContext);
  bindDirectConversationInput(userId, payload.writable, requestId);
  const nextInput = $("[data-direct-chat-input]");
  if (nextInput) {
    nextInput.value = draftVersion === state.directConversationDraftVersion ? draft : "";
    if (restoreFocus) nextInput.focus();
  }
}

function hasComposerDraft(inputSelector, attachmentSelector) {
  const input = $(inputSelector);
  const attachmentInput = $(attachmentSelector);
  return Boolean(input?.value.trim() || attachmentInput?.files?.length);
}

async function setDirectConversationPresence(userId, active) {
  clearInterval(state.presenceTimer);
  try {
    await apiFetch(`/api/direct-conversations/${userId}/presence`, { method: "POST", body: JSON.stringify({ active }) });
    if (active) {
      state.presenceTimer = setInterval(() => {
        apiFetch(`/api/direct-conversations/${userId}/presence`, { method: "POST", body: JSON.stringify({ active: true }) }).catch(() => {});
      }, 20000);
    }
  } catch {}
}

function closeDirectConversationRoom(userId) {
  stopConversationPolling();
  setDirectConversationPresence(userId, false);
}

function startDirectConversationPolling(userId) {
  stopConversationPolling();
  const requestId = state.activeDirectConversationRequestId || "";
  state.conversationPollTimer = setInterval(() => refreshDirectConversation(userId, { requestId }), state.connected ? 5000 : 2500);
}

async function updateDirectConversationPresence(userIds = []) {
  const otherUserId = userIds.find((userId) => userId !== state.session?.id);
  if (!otherUserId || state.activeDirectConversationUserId !== otherUserId || !window.Swal.isVisible()) return;
  const payload = await fetchDirectConversation(otherUserId, state.activeDirectConversationRequestId || "");
  const host = $("[data-direct-chat-presence]");
  if (payload && host) host.textContent = conversationPresenceText(payload.activeUserIds);
}

const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
let rtcConfig = { iceServers: DEFAULT_ICE_SERVERS };
let rtcConfigPromise = null;
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

async function startDirectAudioCall(userId) {
  return startDirectCall(userId, false);
}

async function startDirectVideoCall(userId) {
  return startDirectCall(userId, true);
}

async function startCall(requestId, withVideo = false) {
  if (!callSupported()) return notify("Audio call unavailable", audioCallUnavailableMessage(), "warning");
  if (!state.connected || !state.socket) {
    notify("Live socket", "Reconnecting before the call...", "info");
    await ensureSocketConnected();
  }
  if (!state.connected || !state.socket) return notify("Audio call unavailable", "Live socket is still offline. Reload the page and try again.", "warning");
  if (state.call) return notify("Call already active", "End the current call before starting another.", "warning");
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !canViewConversation(request)) return;
  try {
    if (!await callRecipientIsOnline(requestId, withVideo)) {
      return notify("Audio call", "The other party is offline.", "info");
    }
    const call = createCallState(requestId, createBrowserId(), "outgoing", conversationOtherPartyName(request), conversationOtherPartyPhoto(request), withVideo);
    state.call = call;
    renderCallPanel();
    startCallTone("outgoing");
    scheduleCallTimeout(call);
    await ensureRtcConfig();
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

async function startDirectCall(userId, withVideo = false) {
  const target = userProfile(userId);
  if (!canDirectContact(target)) return;
  if (!callSupported()) return notify("Audio call unavailable", audioCallUnavailableMessage(), "warning");
  if (!state.connected || !state.socket) {
    notify("Live socket", "Reconnecting before the call...", "info");
    await ensureSocketConnected();
  }
  if (!state.connected || !state.socket) return notify("Audio call unavailable", "Live socket is still offline. Reload the page and try again.", "warning");
  if (state.call) return notify("Call already active", "End the current call before starting another.", "warning");
  try {
    if (!await directCallRecipientIsOnline(userId, withVideo)) {
      return notify("Audio call", "The other party is offline.", "info");
    }
    const call = createCallState("", createBrowserId(), "outgoing", target.name, target.photoUrl, withVideo, { directUserId: userId });
    state.call = call;
    renderCallPanel();
    startCallTone("outgoing");
    scheduleCallTimeout(call);
    await ensureRtcConfig();
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

function callRecipientIsOnline(requestId, withVideo = false) {
  return new Promise((resolve) => {
    state.socket.timeout(4000).emit("kaila.call.check", { requestId, withVideo }, (error, response = {}) => resolve(!error && response.ok));
  });
}

function directCallRecipientIsOnline(userId, withVideo = false) {
  return new Promise((resolve) => {
    state.socket.timeout(4000).emit("kaila.call.check", { directUserId: userId, withVideo }, (error, response = {}) => resolve(!error && response.ok));
  });
}

function createCallState(requestId, callId, direction, otherName, otherPhotoUrl = "", withVideo = false, extra = {}) {
  return {
    requestId,
    directUserId: extra.directUserId || "",
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

async function ensureRtcConfig() {
  if (!rtcConfigPromise) {
    rtcConfigPromise = fetch(`${apiBase()}/api/rtc-config`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("RTC config unavailable")))
      .then((payload) => {
        const iceServers = Array.isArray(payload?.iceServers) && payload.iceServers.length ? payload.iceServers : DEFAULT_ICE_SERVERS;
        rtcConfig = { iceServers };
      })
      .catch((error) => {
        console.warn("KAILA RTC config unavailable; using default STUN server.", error);
        rtcConfig = { iceServers: DEFAULT_ICE_SERVERS };
        rtcConfigPromise = null;
      });
  }
  await rtcConfigPromise;
}

function createPeerConnection(call) {
  const peer = new RTCPeerConnection(rtcConfig);
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
    if (peer.connectionState === "failed") endAudioCall(Boolean(call.connectedAt));
    if (peer.connectionState === "closed" && !call.ending) endAudioCall(false);
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
  if (audio.srcObject !== call.remoteStream) audio.srcObject = call.remoteStream;
  audio.play().catch(() => {});
  const remoteVideo = $("[data-call-remote-video]");
  if (remoteVideo) {
    if (remoteVideo.srcObject !== call.remoteStream) remoteVideo.srcObject = call.remoteStream;
    if (remoteVideo.dataset.boundCallId !== call.callId) {
      remoteVideo.dataset.boundCallId = call.callId;
      remoteVideo.addEventListener("playing", () => {
        if (state.call?.callId !== call.callId) return;
        call.remoteVideoPaused = false;
        clearTimeout(call.remoteRecoveryTimer);
        updateCallVideoWaiting(call);
      });
      remoteVideo.addEventListener("waiting", () => {
        if (state.call?.callId !== call.callId) return;
        call.remoteVideoPaused = true;
        scheduleRemoteVideoRecoveryRequest(call);
        updateCallVideoWaiting(call);
      });
      remoteVideo.addEventListener("stalled", () => {
        if (state.call?.callId !== call.callId) return;
        call.remoteVideoPaused = true;
        scheduleRemoteVideoRecoveryRequest(call);
        updateCallVideoWaiting(call);
      });
    }
    remoteVideo.play().catch(() => {});
  }
  const localVideo = $("[data-call-local-video]");
  if (localVideo) {
    if (localVideo.srcObject !== call.localStream) localVideo.srcObject = call.localStream;
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
    await ensureRtcConfig();
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
  state.call.ending = true;
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
  state.socket.timeout(type === "candidate" ? 8000 : 5000).emit("kaila.call.signal", {
    requestId: state.call.requestId,
    directUserId: state.call.directUserId,
    callId: state.call.callId,
    type,
    ...extra,
  }, (error, response = {}) => {
    if (error) {
      if (type === "candidate" || !state.call) return;
      endAudioCall(false);
      notify("Audio call", "Call signaling timed out. Check the live socket connection and try again.", "error");
      return;
    }
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
      state.socket?.emit("kaila.call.signal", { requestId: signal.requestId, directUserId: signal.directUserId || signal.senderId, callId: signal.callId, type: "reject" });
      notify("Audio call unavailable", audioCallUnavailableMessage(), "warning");
      return;
    }
    if (state.call) {
      state.socket?.emit("kaila.call.signal", { requestId: signal.requestId, directUserId: signal.directUserId || signal.senderId, callId: signal.callId, type: "busy" });
      return;
    }
    const request = signal.requestId ? state.requests.find((item) => item.id === signal.requestId) : null;
    const sender = userProfile(signal.senderId);
    const displaySender = directConversationDisplayTarget(sender);
    const senderName = displaySender.name || signal.senderName;
    const senderPhotoUrl = displaySender.photoUrl || sender.photoUrl || (request ? conversationOtherPartyPhoto(request) : "");
    state.call = createCallState(signal.requestId || "", signal.callId, "incoming", senderName, senderPhotoUrl, Boolean(signal.withVideo), { directUserId: signal.directUserId || signal.senderId || "" });
    state.call.remoteDescription = signal.description;
    scheduleCallTimeout(state.call);
    renderCallPanel();
    startCallTone("incoming");
    notifyIncomingCall(senderName, state.call.requestedVideo);
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
    if (!signal.candidate) return;
    if (state.call.peerConnection?.remoteDescription) {
      await state.call.peerConnection.addIceCandidate(signal.candidate).catch((error) => {
        console.warn("KAILA ignored an ICE candidate that could not be applied:", error);
      });
    } else {
      state.call.pendingCandidates.push(signal.candidate);
    }
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
  vibrateAfterInteraction([450, 180, 450, 180, 700]);
  if (document.hidden && window.Notification?.permission === "granted") {
    new Notification(`Incoming KAILA ${callType} call`, { body: `${senderName || "Your job contact"} is calling.` });
  }
}

function startCallTone(mode) {
  if (!state.userInteracted) return;
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
      vibrateAfterInteraction([420, 100, 420, 100, 650]);
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
  vibrateAfterInteraction(0);
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
  while (call.pendingCandidates.length) {
    const candidate = call.pendingCandidates.shift();
    if (!candidate) continue;
    await call.peerConnection.addIceCandidate(candidate).catch((error) => {
      console.warn("KAILA ignored a queued ICE candidate that could not be applied:", error);
    });
  }
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

function conversationOtherPartyName(request = {}) {
  if (request.clientId === state.session?.id) return userProfile(request.acceptedProviderId).name || "Provider";
  return request.clientName || "Client";
}

function conversationOtherPartyPhoto(request = {}) {
  if (!request?.clientId && !request?.acceptedProviderId) return "";
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
    const result = await notePrompt("Close dispute", "Resolution note", true, "Close Dispute");
    if (!result) return;
    body.note = result.note;
  } else if (action === "support_resume_job") {
    const result = await notePrompt("Resume job", "Why should the job continue?", true, "Resume Job");
    if (!result) return;
    body.note = result.note;
  } else if (action === "support_request_revision") {
    const result = await notePrompt("Request revision", "What must the provider correct?", true, "Request Revision");
    if (!result) return;
    body.note = result.note;
  } else if (action === "support_release_payment") {
    const result = await notePrompt("Release payment", "Why is payment being released?", true, "Release Payment");
    if (!result) return;
    body.note = result.note;
  } else if (action === "support_cancel_request") {
    const result = await notePrompt("Cancel after dispute", "Why is this request being cancelled?", true, "Cancel Request");
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

  if (!["cancel", "dispute", "resolve_dispute", "support_resume_job", "support_request_revision", "support_release_payment", "support_cancel_request", "rate", "provider_complete", "request_revision"].includes(action)) {
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
    bestContactTime: $("#settings-best-time")?.value || "",
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
    width: "min(96vw, 1040px)",
    customClass: { popup: "profile-popup" },
    title: "Create account",
    html: `
      <div class="swal-form two">
        <label><span>Role</span>${select("admin-account-role", ["client", "provider", SUPPORT_LABEL, "ops"], "client")}</label>
        <label><span>Full name</span><input id="admin-account-name" class="form-control" autocomplete="name" maxlength="80"></label>
        <label><span>Username</span><input id="admin-account-username" class="form-control" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="40"></label>
        <label><span>Contact number</span><input id="admin-account-contact" class="form-control" type="tel" inputmode="tel" autocomplete="tel" maxlength="32"></label>
        <label><span>Messenger / Facebook</span><input id="admin-account-messenger" class="form-control" inputmode="url" autocomplete="url" maxlength="240"></label>
        <label><span>Preferred contact</span>${select("admin-account-channel", CONTACT_CHANNELS, "Messenger")}</label>
        <label><span>Best contact time</span>${select("admin-account-best-time", AVAILABLE_TIME_OPTIONS, "", "Choose time")}</label>
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
          <label><span>Provider type</span>${select("admin-provider-type", PROVIDER_TYPES, "Individual")}</label>
          <label><span>Service categories</span>${categoryChips("admin-account-category", "")}</label>
          <label><span>Specific services</span><textarea id="admin-provider-services" class="form-control" rows="2"></textarea></label>
          <label><span>Experience</span>${select("admin-provider-experience", EXPERIENCE_OPTIONS, "1-2")}</label>
          <label><span>Coverage area</span>${coverageAreaChips("admin-provider-coverage", "")}</label>
          <label><span>Emergency availability</span>${select("admin-provider-emergency", EMERGENCY_OPTIONS, "Sometimes")}</label>
          <label><span>Available days</span>${availableDaysChips("admin-provider-days", "")}</label>
          <label><span>Available time</span>${timeRangeFields("admin-provider-time", "")}</label>
          <label><span>Travel limits</span><textarea id="admin-provider-travel" class="form-control" rows="2"></textarea></label>
          <label><span>Minimum fee</span><input id="admin-provider-min-fee" class="form-control" type="number" min="0" step="0.01" inputmode="decimal"></label>
          <label><span>Price range</span>${priceRangeFields("admin-provider-price-range", "")}</label>
          <label><span>Work samples</span><input id="admin-provider-work-samples" class="form-control" inputmode="url"></label>
          <label><span>Certificate / permit</span><input id="admin-provider-certificate" class="form-control" inputmode="url"></label>
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
      bindCategoryChips("admin-provider-days");
      bindCategoryChips("admin-provider-coverage");
      $$("[data-password-toggle]", window.Swal.getPopup()).forEach((button) => button.addEventListener("click", togglePasswordVisibility));
      $("#admin-account-role")?.addEventListener("change", syncAdminAccountFields);
      syncAdminAccountFields();
    },
    preConfirm: () => {
      const role = accountRoleValue($("#admin-account-role").value);
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
        area: ["ops", SUPPORT_ROLE].includes(role) ? (role === SUPPORT_ROLE ? "Customer Service" : "Operations") : addressValue("admin-account-address"),
        category: role === "provider" ? selectedCategoryChips("admin-account-category") : [],
        displayName: $("#admin-provider-display")?.value.trim() || "",
        providerType: $("#admin-provider-type")?.value || "",
        specificServices: $("#admin-provider-services")?.value.trim() || "",
        yearsExperience: $("#admin-provider-experience")?.value || "",
        coverageArea: selectedCategoryChips("admin-provider-coverage").join(", "),
        emergencyAvailability: $("#admin-provider-emergency")?.value || "",
        availableDays: selectedCategoryChips("admin-provider-days").join(", "),
        availableTime: timeRangeValue("#admin-provider-time-start", "#admin-provider-time-end"),
        travelLimits: $("#admin-provider-travel")?.value.trim() || "",
        minimumFee: normalizeCurrencyInput($("#admin-provider-min-fee")?.value || ""),
        priceRange: priceRangeValue("#admin-provider-price-range-min", "#admin-provider-price-range-max"),
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
      if (!["ops", SUPPORT_ROLE].includes(role) && !payload.area) {
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
  const role = accountRoleValue($("#admin-account-role")?.value || "client");
  const address = $("[data-admin-account-address]");
  const providerFields = $("[data-admin-provider-fields]");
  if (address) address.hidden = ["ops", SUPPORT_ROLE].includes(role);
  if (providerFields) providerFields.hidden = role !== "provider";
}

function connectSocket(force = false) {
  const urlInput = $("[data-socket-url]");
  const savedUrl = localStorage.getItem(STORAGE.socketUrl) || "";
  const socketUrl = normalizeSocketUrl(urlInput.value.trim()) || normalizeSocketUrl(savedUrl) || defaultSocketUrl();
  urlInput.value = socketUrl;
  localStorage.setItem(STORAGE.socketUrl, socketUrl);
  updateSocketStatus("connecting");
  if (force && state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  if (state.socket) {
    updateSocketStatus(state.connected ? "connected" : "offline");
    return;
  }
  loadSocketClient(socketUrl).then(() => {
    state.socket = window.io(socketIoOrigin(socketUrl), {
      path: socketIoPath(socketUrl),
      transports: ["polling", "websocket"],
      timeout: 12000,
      reconnectionAttempts: 8,
    });
    state.socket.on("connect", () => {
      state.connected = true;
      updateSocketStatus("connected");
      stopRealtimePolling();
      state.socket.emit("subscribe", CHANNEL);
      syncSocketIdentity();
      syncQueuedValidationEntries();
    });
    state.socket.on("disconnect", () => {
      state.connected = false;
      updateSocketStatus("offline");
      startRealtimePolling();
      if (state.call) {
        endAudioCall(false);
        notify("Audio call", "The live connection was lost.", "warning");
      }
    });
    state.socket.on("connect_error", () => {
      state.connected = false;
      updateSocketStatus("offline");
      startRealtimePolling();
    });
    state.socket.on("kaila.state.updated", applyServerState);
    state.socket.on("kaila.request.created", handleRequestCreated);
    state.socket.on("kaila.provider.saved", handleProviderSaved);
    state.socket.on("kaila.offer.saved", handleOfferSaved);
    state.socket.on("kaila.request.confirmed", handleRequestConfirmed);
    state.socket.on("kaila.request.passed", handleRequestPassed);
    state.socket.on("kaila.request.action", handleRequestAction);
    state.socket.on("kaila.validation.updated", () => {
      if (["admin", "ops"].includes(state.session?.role)) loadState({ silent: true }).catch(() => {});
    });
    state.socket.on("kaila.message.saved", handleMessageSaved);
    state.socket.on("kaila.direct-message.saved", handleDirectMessageSaved);
    state.socket.on("kaila.typing.changed", handleTypingChanged);
    state.socket.on("kaila.message.reaction", ({ requestId }) => refreshConversation(requestId));
    state.socket.on("kaila.presence.changed", ({ requestId }) => updateConversationPresence(requestId));
    state.socket.on("kaila.direct-presence.changed", ({ userIds }) => updateDirectConversationPresence(userIds));
    state.socket.on("kaila.call.signal", (signal) => handleCallSignal(signal).catch((error) => {
      endAudioCall(false);
      notify("Call failed", error.message || "Audio call signaling failed.", "error");
    }));
    state.socket.on("kaila.activity", (activity) => {
      if (!state.activity.some((item) => item.id === activity.id)) state.activity.unshift(activity);
      if (shouldBadgeActivityNotifications()) addUnreadNotification(notificationItemFromActivity(activity));
      renderActivity();
    });
    state.socket.on("kaila.missed-call.saved", (missedCall) => {
      if (!missedCall || missedCall.recipientId !== state.session?.id) return;
      state.missedCalls = [missedCall, ...state.missedCalls.filter((item) => item.id !== missedCall.id)].slice(0, 30);
      addUnreadNotification(notificationItemFromMissedCall(missedCall));
      renderActivity();
    });
  }).catch(() => {
    updateSocketStatus("offline");
    startRealtimePolling();
    addActivity("Socket offline", "Start kaila/socket.");
  });
}

function ensureSocketConnected(timeout = 12000) {
  connectSocket(!state.socket);
  if (state.connected && state.socket?.connected) return Promise.resolve(true);
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (state.connected && state.socket?.connected) return cleanup(true);
      if (state.socket && !state.socket.connected) state.socket.connect?.();
      if (Date.now() - startedAt >= timeout) cleanup(false);
    }, 250);
    function cleanup(result) {
      clearInterval(timer);
      resolve(result);
    }
  });
}

function updateSocketStatus(status) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const dot = $("[data-socket-dot]");
  const label = $("[data-socket-label]");
  const button = $("[data-socket-button]");
  if (dot) dot.classList.toggle("connected", isConnected);
  if (label) label.textContent = isConnected ? "Live" : status === "connecting" ? "Connecting" : "Offline";
  if (button) {
    button.classList.toggle("btn-outline-success", isConnected);
    button.classList.toggle("btn-outline-secondary", isConnecting);
    button.classList.toggle("btn-outline-danger", !isConnected && !isConnecting);
  }
}

function syncSocketIdentity() {
  state.socket?.emit("identify", state.session?.id || "");
}

function startRealtimePolling() {
  if (state.realtimePollTimer) return;
  state.realtimePollTimer = setInterval(() => {
    if (!state.connected) loadState({ silent: true }).catch(() => {});
  }, 10000);
}

function stopRealtimePolling() {
  clearInterval(state.realtimePollTimer);
  state.realtimePollTimer = null;
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
  if (!request || !message || !state.session) return;
  if (!canViewConversation(request)) return;
  if (state.activeConversationId === requestId) {
    refreshConversation(requestId);
    return;
  }
  if (message.senderId === state.session.id) return;
  addUnreadMessage({
    type: "job",
    id: requestId,
    title: request.category,
    sender: message.senderName,
    detail: message.detail,
    createdAt: message.createdAt,
  });
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

function handleDirectMessageSaved({ userIds = [], message } = {}) {
  if (!message || !state.session || !userIds.includes(state.session.id)) return;
  const otherUserId = message.senderId;
  const activeOtherUserId = userIds.find((userId) => userId !== state.session.id) || otherUserId;
  const sender = userProfile(otherUserId);
  const requestId = message.requestId || "";
  if (state.activeDirectConversationUserId === activeOtherUserId && state.activeDirectConversationRequestId === requestId) {
    refreshDirectConversation(activeOtherUserId, { requestId });
    return;
  }
  if (message.senderId === state.session.id) return;
  const senderName = chatMessageSenderName(message);
  addUnreadMessage({
    type: "direct",
    id: directConversationMessageKey(otherUserId, requestId),
    userId: otherUserId,
    requestId,
    title: sender.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session.role) ? "KAILA Customer Service" : sender.name || message.senderName || "Direct message",
    sender: senderName,
    detail: message.detail,
    createdAt: message.createdAt,
  });
  announceAttentionEvent("New direct message", `${senderName}: ${message.detail || "Sent media"}`, "message");

  queueAttentionModal({
    icon: "info",
    title: "New direct message",
    confirmButtonText: "Open messages",
    onConfirm: () => openDirectConversation(otherUserId, requestId),
    html: `
      <div class="text-start">
        ${renderIdentity(sender.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session.role) ? "KAILA Customer Service" : sender.name || message.senderName, sender.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session.role) ? SUPPORT_AVATAR : sender.photoUrl, `${roleLabel(sender.role || "user")} account`, sender.reputation, "compact")}
        <p class="mb-0">${escapeHtml(message.detail || "Sent media")}</p>
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
  if (kind !== "message") addUnreadNotification();
  playAttentionTone(kind);
  vibrateAfterInteraction(kind === "urgent" ? [500, 100, 500, 100, 700] : [280, 90, 280, 90, 420]);
  if (document.hidden && window.Notification?.permission === "granted") {
    new Notification(`KAILA: ${title}`, {
      body: detail,
      icon: "assets/android-chrome-192x192.png",
      tag: `kaila-${kind}`,
    });
  }
}

function loadAttentionBadgesForSession() {
  state.unreadNotifications = 0;
  state.unreadNotificationItems = [];
  state.unreadMessages = [];
  const saved = readJson(STORAGE.attentionBadges, {});
  const sessionId = state.session?.id;
  if (!sessionId) return;
  const userBadges = saved[sessionId] || {};
  state.unreadNotifications = Number(userBadges.notifications || 0);
  state.unreadNotificationItems = Array.isArray(userBadges.notificationItems) ? userBadges.notificationItems : [];
  let badgesChanged = false;
  if (!shouldBadgeActivityNotifications()) {
    const beforeCount = state.unreadNotificationItems.length;
    state.unreadNotificationItems = state.unreadNotificationItems.filter((item) => item.type !== "activity");
    state.unreadNotifications = state.unreadNotificationItems.length;
    badgesChanged = beforeCount !== state.unreadNotificationItems.length;
  }
  state.unreadMessages = Array.isArray(userBadges.messages) ? userBadges.messages : [];
  if (badgesChanged) persistAttentionBadges();
}

function persistAttentionBadges() {
  const saved = readJson(STORAGE.attentionBadges, {});
  if (state.session?.id) {
    saved[state.session.id] = {
      notifications: unreadNotificationCount(),
      notificationItems: state.unreadNotificationItems,
      messages: state.unreadMessages,
    };
  }
  localStorage.setItem(STORAGE.attentionBadges, JSON.stringify(saved));
}

function renderAttentionBadges() {
  const notificationButton = $("[data-notification-bell]");
  const messageButton = $("[data-message-bell]");
  const notificationCount = $("[data-notification-count]");
  const messageCount = $("[data-message-count]");
  const signedIn = Boolean(state.session);
  const notifications = signedIn ? unreadNotificationCount() : 0;
  const messages = signedIn ? state.unreadMessages.length : 0;
  if (notificationButton) {
    notificationButton.classList.toggle("has-unread", notifications > 0);
    notificationButton.setAttribute("aria-label", notifications ? `${notifications} unread notification${notifications === 1 ? "" : "s"}` : "Notifications");
  }
  if (messageButton) {
    messageButton.classList.toggle("has-unread", messages > 0);
    messageButton.setAttribute("aria-label", messages ? `${messages} unread message${messages === 1 ? "" : "s"}` : "Messages");
  }
  setBellCount(notificationCount, notifications);
  setBellCount(messageCount, messages);
}

function setBellCount(element, count) {
  if (!element) return;
  element.hidden = count <= 0;
  element.textContent = count > 99 ? "99+" : String(count);
}

function unreadNotificationCount() {
  return state.unreadNotificationItems.length || Number(state.unreadNotifications || 0);
}

function addUnreadNotification(item = null) {
  if (!state.session) return;
  if ($("#activity-pane")?.classList.contains("active")) {
    if (item?.type && item.createdAt) markNotificationTypeReadAt(item.type, item.createdAt);
    return;
  }
  if (item?.key) {
    state.unreadNotificationItems = [
      item,
      ...state.unreadNotificationItems.filter((existing) => existing.key !== item.key),
    ].slice(0, 80);
    state.unreadNotifications = state.unreadNotificationItems.length;
  } else {
    state.unreadNotifications = Math.min(99, unreadNotificationCount() + 1);
  }
  persistAttentionBadges();
  renderAttentionBadges();
}

function clearUnreadNotifications() {
  if (!unreadNotificationCount()) return;
  markNotificationsRead();
  state.unreadNotifications = 0;
  state.unreadNotificationItems = [];
  persistAttentionBadges();
  renderAttentionBadges();
}

function addUnreadMessage(message) {
  if (!state.session || !message?.type || !message?.id) return;
  const key = `${message.type}:${message.id}`;
  state.unreadMessages = [
    { ...message, key },
    ...state.unreadMessages.filter((item) => item.key !== key),
  ].slice(0, 20);
  persistAttentionBadges();
  renderAttentionBadges();
}

function clearUnreadMessage(type, id) {
  const key = `${type}:${id}`;
  const nextMessages = state.unreadMessages.filter((item) => item.key !== key);
  if (nextMessages.length === state.unreadMessages.length) return;
  state.unreadMessages = nextMessages;
  persistAttentionBadges();
  renderAttentionBadges();
}

function clearUnreadMessages() {
  if (!state.unreadMessages.length) return;
  state.unreadMessages.forEach((message) => markConversationReadAt(message.type, message.id, message.createdAt));
  state.unreadMessages = [];
  persistAttentionBadges();
  renderAttentionBadges();
}

async function syncUnreadNotificationSummaries() {
  if (!state.session || state.session.role === "ops" || state.notificationSummarySyncing) return;
  state.notificationSummarySyncing = true;
  try {
    const summary = await apiFetch("/api/notification-summary", { method: "GET", silentError: true });
    state.missedCalls = Array.isArray(summary.missedCalls) ? summary.missedCalls : [];
    if (shouldBadgeActivityNotifications()) {
      (summary.activities || []).forEach((activity) => {
        if (!isUnreadNotification("activity", activity.createdAt)) return;
        addUnreadNotification(notificationItemFromActivity(activity));
      });
    }
    state.missedCalls.forEach((missedCall) => {
      if (!isUnreadNotification("missedCall", missedCall.createdAt)) return;
      addUnreadNotification(notificationItemFromMissedCall(missedCall));
    });
    renderActivity();
  } catch (error) {
    if (error.status === 404) return;
    if (!error.offline) console.warn("KAILA notification summary sync failed:", error);
  } finally {
    state.notificationSummarySyncing = false;
  }
}

function shouldBadgeActivityNotifications() {
  return state.session?.role === "admin";
}

function notificationItemFromActivity(activity = {}) {
  if (!activity.id) return null;
  return {
    type: "activity",
    id: activity.id,
    key: `activity:${activity.id}`,
    title: activity.title || "Activity",
    detail: activity.detail || "",
    createdAt: activity.createdAt,
  };
}

function notificationItemFromMissedCall(call = {}) {
  if (!call.id) return null;
  const callLabel = call.callType === "video" ? "video call" : "audio call";
  const detail = call.callerId === state.session?.id
    ? `You called${call.contextTitle ? ` about ${call.contextTitle}` : ""}, but the call was not answered.`
    : `${call.callerName || "A KAILA user"} tried to call${call.contextTitle ? ` about ${call.contextTitle}` : ""}.`;
  return {
    type: "missedCall",
    id: call.id,
    key: `missedCall:${call.id}`,
    title: `Missed ${callLabel}`,
    detail,
    createdAt: call.createdAt,
  };
}

function isUnreadNotification(type, createdAt) {
  if (!createdAt) return false;
  const readAt = notificationReadAt(type);
  if (!readAt) return true;
  return new Date(createdAt).getTime() > new Date(readAt).getTime();
}

function markNotificationsRead() {
  markNotificationTypeReadAt("activity", latestMessageCreatedAt(state.activity));
  markNotificationTypeReadAt("missedCall", latestMessageCreatedAt(state.missedCalls));
}

function markNotificationTypeReadAt(type, readAt) {
  if (!state.session || !type || !readAt) return;
  const reads = readJson(STORAGE.notificationReads, {});
  const userReads = reads[state.session.id] || {};
  userReads[type] = readAt;
  reads[state.session.id] = userReads;
  localStorage.setItem(STORAGE.notificationReads, JSON.stringify(reads));
}

function notificationReadAt(type) {
  if (!state.session) return "";
  return readJson(STORAGE.notificationReads, {})[state.session.id]?.[type] || "";
}

async function syncUnreadMessageSummaries() {
  if (!state.session || state.messageSummarySyncing) return;
  state.messageSummarySyncing = true;
  try {
    const summary = await apiFetch("/api/message-summary", { method: "GET", silentError: true });
    (summary.jobMessages || []).forEach((item) => {
      const message = item.message || {};
      if (!message.id || message.senderId === state.session.id || !isUnreadConversationMessage("job", item.requestId, message)) return;
      addUnreadMessage({
        type: "job",
        id: item.requestId,
        title: item.title || "Job message",
        sender: message.senderName,
        detail: message.detail,
        createdAt: message.createdAt,
      });
    });
    (summary.directMessages || []).forEach((item) => {
      const message = item.message || {};
      if (!message.id || message.senderId === state.session.id || !isUnreadConversationMessage("direct", item.userId, message)) return;
      addUnreadMessage({
        type: "direct",
        id: item.userId,
        title: item.title || message.senderName || "Direct message",
        sender: message.senderName,
        detail: message.detail,
        createdAt: message.createdAt,
      });
    });
  } catch (error) {
    if (error.status === 404) return;
    if (!error.offline) console.warn("KAILA message summary sync failed:", error);
  } finally {
    state.messageSummarySyncing = false;
  }
}

function isUnreadConversationMessage(type, id, message = {}) {
  if (!type || !id || !message.createdAt) return false;
  const readAt = conversationReadAt(type, id);
  if (!readAt) return true;
  return new Date(message.createdAt).getTime() > new Date(readAt).getTime();
}

function markConversationRead(type, id, messages = []) {
  if (!state.session || !type || !id) return;
  const latest = latestMessageCreatedAt(messages);
  if (!latest) return;
  markConversationReadAt(type, id, latest);
}

function markConversationReadAt(type, id, readAt) {
  if (!state.session || !type || !id || !readAt) return;
  const reads = readJson(STORAGE.messageReads, {});
  const userReads = reads[state.session.id] || {};
  userReads[`${type}:${id}`] = readAt;
  reads[state.session.id] = userReads;
  localStorage.setItem(STORAGE.messageReads, JSON.stringify(reads));
}

function conversationReadAt(type, id) {
  if (!state.session) return "";
  return readJson(STORAGE.messageReads, {})[state.session.id]?.[`${type}:${id}`] || "";
}

function latestMessageCreatedAt(messages = []) {
  return messages
    .map((message) => message.createdAt)
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || "";
}

function openNotificationBell() {
  if (!state.session) return;
  route("app");
  const activityOpen = $("#activity-pane")?.classList.contains("active");
  activateTab(activityOpen ? fallbackDashboardTab() : "#activity-pane");
  clearUnreadNotifications();
}

async function openMessageBell() {
  if (!state.session) return;
  const unreadMessages = [...state.unreadMessages];
  const hasUnreadMessages = unreadMessages.length > 0;
  const result = await modal({
    title: hasUnreadMessages ? "Unread messages" : "Messages",
    confirmButtonText: hasUnreadMessages ? "Mark all read" : "View requests",
    showCancelButton: true,
    cancelButtonText: "Close",
    html: `
      <div class="bell-message-list">
        ${hasUnreadMessages ? unreadMessages.map((message) => `
          <button class="bell-message-item" type="button" data-open-unread-message="${escapeAttribute(message.key)}">
            <strong>${escapeHtml(message.title || "Message")}</strong>
            <span>${escapeHtml(message.sender || "KAILA")}${message.createdAt ? ` - ${escapeHtml(formatDateTime(message.createdAt))}` : ""}</span>
            <p>${escapeHtml(message.detail || "")}</p>
          </button>
        `).join("") : `
          <div class="bell-message-empty">
            <i class="fa-solid fa-message"></i>
            <strong>No unread messages</strong>
            <p>New job and direct messages will appear here.</p>
          </div>
        `}
      </div>
    `,
    didOpen: (popup) => {
      tuneFormDensity(popup);
      $$("[data-open-unread-message]", popup).forEach((button) => {
        button.addEventListener("click", () => {
          const message = unreadMessages.find((item) => item.key === button.dataset.openUnreadMessage);
          window.Swal.close();
          if (!message) return;
          setTimeout(() => {
            if (message.type === "direct") openDirectConversation(message.userId || message.id, message.requestId || "");
            else openConversation(message.id);
          }, 120);
        });
      });
    },
  });
  if (!result.isConfirmed) return;
  if (hasUnreadMessages) {
    clearUnreadMessages();
    return;
  }
  route("app");
  activateTab("#requests-pane");
}

function playAttentionTone(kind = "update") {
  if (!state.userInteracted || state.call || callTone) return;
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

function vibrateAfterInteraction(pattern) {
  if (!state.userInteracted || !navigator.vibrate) return;
  navigator.vibrate(pattern);
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
    const localHosts = ["localhost", "127.0.0.1", "::1"];
    const isLocalPage = localHosts.includes(window.location.hostname);
    if (localHosts.includes(url.hostname) && !isLocalPage) return "";
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
  return loadScript(`${socketUrl.replace(/\/$/, "")}/socket.io/socket.io.js`)
    .catch(() => loadScript("https://cdn.socket.io/4.8.1/socket.io.min.js"));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
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
  if (state.session.role === SUPPORT_ROLE) return true;
  return request.clientId === state.session.id || request.acceptedProviderId === state.session.id;
}

function jobActionButtons(request) {
  if (!state.session) return "";
  const buttons = [];
  const isClient = state.session.role === "client" && request.clientId === state.session.id;
  const isProvider = state.session.role === "provider" && request.acceptedProviderId === state.session.id;
  const isSupport = state.session.role === SUPPORT_ROLE;
  const add = (action, label, style = "outline-secondary") => {
    buttons.push(`<button class="btn btn-sm btn-${style}" data-request-id="${request.id}" data-job-action="${action}">${label}</button>`);
  };

  if (isSupport && request.status === "Disputed") {
    add("support_resume_job", "Resume Job", "outline-primary");
    add("support_request_revision", "Request Revision", "outline-warning");
    add("support_release_payment", "Release Payment", "outline-success");
    add("support_cancel_request", "Cancel Request", "outline-danger");
    add("resolve_dispute", "Close Dispute", "outline-secondary");
    return buttons.join("");
  }
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
  const optionItems = [...options];
  selectedItems.forEach((item) => {
    if (item && !optionItems.includes(item)) optionItems.push(item);
  });
  return `<select id="${id}" class="form-select" ${multiple ? "multiple size=\"4\"" : ""}>${blank ? `<option value="">${blank}</option>` : ""}${optionItems.map((item) => {
    const isSelected = multiple ? selectedItems.includes(item) : item === selected;
    return `<option value="${escapeAttribute(item)}" ${isSelected ? "selected" : ""}>${escapeHtml(item)}</option>`;
  }).join("")}</select>`;
}

function categorySelect(id, blank = false, selected = "", multiple = false) {
  return select(id, SERVICE_CATEGORIES, selected, blank ? "Choose category" : "", multiple);
}

function coverageAreaChips(id, selected = "") {
  return optionChips(id, sortedBarangays(state.geography.barangays), selected, {
    selectedEmpty: "Select barangays below",
    optionsEmpty: "All barangays selected",
  });
}

function availableDaysChips(id, selected = "") {
  const selectedDays = categoryList(selected).filter((day) => AVAILABLE_DAY_OPTIONS.includes(day));
  return optionChips(id, AVAILABLE_DAY_OPTIONS, selectedDays, {
    selectedEmpty: "Select days below",
    optionsEmpty: "All days selected",
  });
}

function timeRangeFields(id, value = "") {
  const range = parseTimeRange(value);
  return `
    <div class="range-grid">
      <input id="${escapeAttribute(id)}-start" class="form-control" type="time" value="${escapeAttribute(range.start)}" aria-label="Start time">
      <input id="${escapeAttribute(id)}-end" class="form-control" type="time" value="${escapeAttribute(range.end)}" aria-label="End time">
    </div>
  `;
}

function priceRangeFields(id, value = "") {
  const range = parsePriceRange(value);
  return `
    <div class="range-grid">
      <input id="${escapeAttribute(id)}-min" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeAttribute(range.min)}" placeholder="Min">
      <input id="${escapeAttribute(id)}-max" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeAttribute(range.max)}" placeholder="Max">
    </div>
  `;
}

function categoryChips(id, selected = "") {
  return optionChips(id, SERVICE_CATEGORIES, selected, {
    selectedEmpty: "Select categories below",
    optionsEmpty: "All categories selected",
  });
}

function optionChips(id, options, selected = "", labels = {}) {
  const selectedItems = categoryList(selected);
  const availableItems = options.filter((item) => !selectedItems.includes(item));
  const selectedEmpty = labels.selectedEmpty || "Select options below";
  const optionsEmpty = labels.optionsEmpty || "All options selected";
  return `
    <div class="category-chip-box" data-category-chip-box="${escapeAttribute(id)}">
      <div class="category-chip-selected" data-category-selected>
        ${selectedItems.map((item) => categoryChip(item, true)).join("") || `<span class="category-chip-empty">${escapeHtml(selectedEmpty)}</span>`}
      </div>
      <div class="category-chip-options" data-category-options>
        ${availableItems.map((item) => categoryChip(item)).join("") || `<span class="category-chip-empty">${escapeHtml(optionsEmpty)}</span>`}
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
    box.outerHTML = chipsForId(id, next);
    bindCategoryChips(id);
  }));
}

function selectedCategoryChips(id) {
  const box = $(`[data-category-chip-box="${escapeCssIdentifier(id)}"]`);
  if (!box) return [];
  return $$("[data-category-selected] .category-chip", box).map((button) => button.dataset.categoryChip).filter(Boolean);
}

function chipsForId(id, selected = "") {
  if (id.includes("days")) return availableDaysChips(id, selected);
  if (id.includes("coverage")) return coverageAreaChips(id, selected);
  return categoryChips(id, selected);
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
      <label><span>Purok</span><input id="${escapeAttribute(id)}-purok" class="form-control" data-address-purok inputmode="text" maxlength="60" value="${escapeAttribute(address.purok)}" placeholder="Purok / Zone"></label>
      <label><span>House No. <small>(optional)</small></span><input id="${escapeAttribute(id)}-house" class="form-control" data-address-house inputmode="text" maxlength="60" value="${escapeAttribute(address.house)}" placeholder="House no."></label>
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

function timeRangeValue(startSelector, endSelector) {
  const start = $(startSelector)?.value || "";
  const end = $(endSelector)?.value || "";
  if (!start && !end) return "";
  return [start || "Any", end || "Any"].join(" - ");
}

function parseTimeRange(value = "") {
  const [start = "", end = ""] = String(value || "").match(/\b\d{2}:\d{2}\b/g) || [];
  return { start, end };
}

function priceRangeValue(minSelector, maxSelector) {
  const min = normalizeCurrencyInput($(minSelector)?.value || "");
  const max = normalizeCurrencyInput($(maxSelector)?.value || "");
  if (min && max) return `${min} - ${max}`;
  return min || max || "";
}

function parsePriceRange(value = "") {
  const numbers = String(value || "").match(/\d+(?:\.\d+)?/g) || [];
  return {
    min: numbers[0] ? currencyInputValue(numbers[0]) : "",
    max: numbers[1] ? currencyInputValue(numbers[1]) : "",
  };
}

function categoryList(value = "") {
  if (Array.isArray(value)) return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  return Array.from(new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean)));
}

function tuneFormDensity(scope = document) {
  $$(".swal-form.two > label, .address-grid > label", scope).forEach((label) => {
    if (label.classList.contains("wide") || label.matches(".field-sm, .field-md, .field-lg")) return;
    const control = label.querySelector("select, input, textarea");
    if (!control) return;
    label.classList.add(fieldDensityClass(control));
  });
}

function fieldDensityClass(control) {
  const tag = control.tagName;
  if (tag === "TEXTAREA") return "field-lg";
  if (tag === "SELECT") {
    const longestOption = Array.from(control.options).reduce((longest, option) => Math.max(longest, option.textContent.trim().length), 0);
    if (longestOption <= 12) return "field-sm";
    if (longestOption <= 32) return "field-md";
    return "field-lg";
  }
  if (tag === "INPUT") {
    const type = (control.getAttribute("type") || "text").toLowerCase();
    if (["checkbox", "radio", "number", "time", "date", "month", "week"].includes(type)) return "field-sm";
    if (["tel", "email", "password"].includes(type)) return "field-md";
    if (["url", "file"].includes(type)) return "field-lg";
    const maxLength = Number(control.getAttribute("maxlength") || 0);
    if (maxLength && maxLength <= 40) return "field-sm";
    const placeholderLength = (control.getAttribute("placeholder") || "").trim().length;
    if (placeholderLength && placeholderLength <= 16) return "field-sm";
  }
  return "field-md";
}

function modal(options) {
  const { customClass = {}, didOpen, ...modalOptions } = options;
  const popupClass = ["kaila-popup", customClass.popup].filter(Boolean).join(" ");
  return window.Swal.fire({
    customClass: { ...customClass, popup: popupClass },
    showCancelButton: true,
    reverseButtons: true,
    focusConfirm: false,
    didOpen: (popup) => {
      tuneFormDensity(popup);
      didOpen?.(popup);
    },
    ...modalOptions,
  });
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

async function rememberOfflineLogin(username, password, user) {
  if (!username || !password || !user) return;
  const key = offlineUsernameKey(username);
  const credentials = readJson(STORAGE.offlineCredentials, {});
  const salt = cryptoRandomHex(16);
  const verifiers = await offlinePasswordVerifiers(key, password, salt);
  credentials[key] = {
    user,
    salt,
    verifier: verifiers[0],
    verifiers,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE.offlineCredentials, JSON.stringify(credentials));
}

async function tryOfflineLogin(data = {}) {
  const key = offlineUsernameKey(data.username);
  const stored = readJson(STORAGE.offlineCredentials, {})[key];
  if (!stored?.user || !stored.salt || !stored.verifier) {
    notify("Offline login unavailable", "Log in once while online on this device first so KAILA can save an offline verifier.", "warning");
    return false;
  }
  const verifiers = await offlinePasswordVerifiers(key, data.password || "", stored.salt);
  const storedVerifiers = [stored.verifier, ...(Array.isArray(stored.verifiers) ? stored.verifiers : [])].filter(Boolean);
  if (!storedVerifiers.some((storedVerifier) => verifiers.some((verifier) => offlineVerifierMatches(storedVerifier, verifier)))) {
    notify("Offline login failed", "Use the same username and password last verified online on this device.", "error");
    return false;
  }

  state.session = stored.user;
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  loadAttentionBadgesForSession();
  syncSocketIdentity();
  const cached = readJson(STORAGE.stateSnapshot, null);
  if (cached) applyServerState(cached, { fromCache: true });
  else {
    state.validationEntries = mergeQueuedValidationEntries([]);
    render();
  }
  syncQueuedValidationEntries();
  await successRedirect("Offline login", `Welcome back, ${state.session.name}. Saved entries will sync when online.`);
  return true;
}

function offlineUsernameKey(username) {
  return String(username || "").trim().toLowerCase();
}

async function offlinePasswordVerifier(usernameKey, password, salt) {
  const verifiers = await offlinePasswordVerifiers(usernameKey, password, salt);
  return verifiers[0];
}

async function offlinePasswordVerifiers(usernameKey, password, salt) {
  const value = `${usernameKey}:${salt}:${password}`;
  const verifiers = [];
  if (window.crypto?.subtle && window.TextEncoder) {
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    verifiers.push(`sha256:${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`);
  }
  verifiers.push(`local:${localStringVerifier(value)}`);
  return verifiers;
}

function offlineVerifierMatches(storedVerifier, verifier) {
  if (storedVerifier === verifier) return true;
  if (!String(storedVerifier || "").includes(":") && verifier.startsWith("sha256:")) {
    return storedVerifier === verifier.slice("sha256:".length);
  }
  return false;
}

function cryptoRandomHex(length = 16) {
  if (!window.crypto?.getRandomValues) {
    return Array.from({ length }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
  }
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function localStringVerifier(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function notify(title, text = "", icon = "info") {
  window.Swal.fire({ toast: true, position: "top-end", icon, title, text, showConfirmButton: false, timer: 2200 });
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function readJsonFromString(value, fallback) {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function roleLabel(role) {
  if (role === SUPPORT_ROLE) return SUPPORT_LABEL;
  return capitalize(String(role || "user"));
}

function accountRoleValue(role) {
  const clean = String(role || "").trim().toLowerCase();
  if (["customer service", "customer-service", "support", SUPPORT_ROLE].includes(clean)) return SUPPORT_ROLE;
  return clean;
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

function currencyInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "open") return "";
  const amount = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? String(amount) : raw;
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
