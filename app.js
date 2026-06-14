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
  savedLogin: "kaila.deploy.savedLogin",
  attentionBadges: "kaila.deploy.attentionBadges",
  messageReads: "kaila.deploy.messageReads",
  notificationReads: "kaila.deploy.notificationReads",
  pushDeviceId: "kaila.deploy.pushDeviceId",
  mobileUpdateCheck: "kaila.deploy.mobileUpdateCheck",
  activeRole: "kaila.deploy.activeRole",
};
const SOCIAL_AUTH_PENDING_PREFIX = "kaila.socialAuth.";
const SOCIAL_AUTH_GOOGLE_PROFILE_TOKEN = "kaila.socialAuth.googleProfileToken";
const SOCIAL_AUTH_FACEBOOK_PENDING_PREFIX = "kaila.socialAuth.facebook.";
const SERVICE_CATEGORIES = ["Appliance repair", "Plumbing", "Electrical", "Computer repair", "Cellphone repair", "Mechanical / motorcycle", "Carpentry / home maintenance", "Cleaning", "AirCon Cleaning", "Graphic / digital services", "General odd jobs"];
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
const APP_ROUTES = ["landing", "register", "login", "privacy", "terms", "support", "public-post", "app"];
const SUPPORT_ROLE = "customer_service";
const SUPPORT_LABEL = "Customer Service";
const SUPPORT_AVATAR = "assets/kaila-customer-service-avatar.png";
const STAFF_ROLES = ["admin", "ops", SUPPORT_ROLE];
const APP_TIME_ZONE = "Asia/Manila";
const PRODUCTION_HOST = "kaila-app.com";
const PRODUCTION_API_PATH = "/kaila-api";
const NATIVE_SOCKET_URL = `https://${PRODUCTION_HOST}${PRODUCTION_API_PATH}`;
const CALL_RING_TIMEOUT_MS = 60000;
const CALL_SIGNAL_TIMEOUT_MS = 20000;
const CALL_CANDIDATE_TIMEOUT_MS = 10000;
const URGENT_ATTENTION_MS = 18000;
const NATIVE_NOTIFICATION_CHANNELS = {
  updates: "kaila-updates",
  urgent: "kaila-urgent",
  jobs: "kaila-job-alerts-v3",
  calls: "kaila-calls",
};
const BARANGAY_COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const INDEPENDENT_CITY_PROVINCE = "Independent City";
const GEOGRAPHY_SOURCES = [
  "assets/Gingoog City PSGC.xlsx",
  "assets/Butuan City PSGC.xlsx",
];
const DEFAULT_MAP_CENTER = { lat: 8.826, lng: 125.117 };
const ROUTE_DISTANCE_CACHE_MS = 6 * 60 * 60 * 1000;
const ROUTE_DISTANCE_DIRECT_URL = "https://router.project-osrm.org/route/v1/driving";
const NAVIGATION_SEND_INTERVAL_MS = 8000;
const NAVIGATION_MIN_MOVE_METERS = 12;
const NAVIGATION_STALE_MS = 45000;
const NAVIGATION_SPEED_KMH = 22;
const MOBILE_UPDATE_PROMPT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_GEOGRAPHY = {
  region: "Region X (Northern Mindanao)",
  province: "Misamis Oriental",
  city: "City of Gingoog",
  regions: ["Region X (Northern Mindanao)"],
  provinces: ["Misamis Oriental"],
  cities: ["City of Gingoog"],
  provinceRegions: { "Misamis Oriental": "Region X (Northern Mindanao)" },
  provinceCities: { "Misamis Oriental": ["City of Gingoog"] },
  cityRegions: { "City of Gingoog": "Region X (Northern Mindanao)" },
  cityProvinces: { "City of Gingoog": "Misamis Oriental" },
  cityBarangays: {},
  barangays: ["Agay-ayan", "Alagatan", "Anakan", "Bagubad", "Bakidbakid", "Bal-ason", "Bantaawan", "Binakalan", "Capitulangan", "Daan-Lungsod", "Hindangon", "Kalagonoy", "Kibuging", "Kipuntos", "Lawaan", "Lawit", "Libertad", "Libon", "Lunao", "Lunotan", "Malibud", "Malinao", "Maribucao", "Mimbuntong", "Mimbalagon", "Mimbunga", "Minsapinit", "Murallon", "Odiongan", "Pangasihan", "Pigsaluhan", "Barangay 1", "Barangay 10", "Barangay 11", "Barangay 12", "Barangay 13", "Barangay 14", "Barangay 15", "Barangay 16", "Barangay 17", "Barangay 18-A", "Barangay 19", "Barangay 2", "Barangay 20", "Barangay 21", "Barangay 22-A", "Barangay 23", "Barangay 24", "Barangay 25", "Barangay 26", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Punong", "Ricoro", "Samay", "San Juan", "San Luis", "San Miguel", "Santiago", "Talisay", "Talon", "Tinabalan", "Tinulongan", "Barangay 18", "Barangay 22", "Barangay 24-A", "Dinawehan", "Eureka", "Kalipay", "Kamanikan", "Kianlagan", "San Jose", "Sangalan", "Tagpako"],
};
FALLBACK_GEOGRAPHY.cityBarangays[FALLBACK_GEOGRAPHY.city] = FALLBACK_GEOGRAPHY.barangays;

const state = {
  session: readJson(STORAGE.session, null),
  users: [],
  requests: [],
  providers: [],
  reports: [],
  blocks: [],
  feedPosts: [],
  feedLoaded: false,
  feedSyncing: false,
  publicPost: null,
  publicPostLoading: false,
  publicPostId: "",
  validationEntries: [],
  activity: [],
  missedCalls: [],
  socket: null,
  connected: false,
  socketIdentityUserId: "",
  pendingNativeCallAction: "",
  pendingNativeCallId: "",
  lastStateRefreshAt: 0,
  providerDistanceLocationRefreshing: false,
  userInteracted: false,
  attentionQueue: [],
  unreadNotifications: 0,
  unreadNotificationItems: [],
  unreadMessages: [],
  attentionTimer: null,
  attentionOpen: false,
  attentionLoop: null,
  notificationClicksBound: false,
  activeOfferPromptRequestId: null,
  lastDashboardTabTarget: "#feed-pane",
  activeConversationId: null,
  activeDirectConversationUserId: null,
  activeDirectConversationRequestId: "",
  activeWorkspaceCleanup: null,
  conversationDraftVersion: 0,
  directConversationDraftVersion: 0,
  messageSummarySyncing: false,
  notificationSummarySyncing: false,
  nativeNotificationsReady: false,
  nativeNotificationListenersBound: false,
  pushNotificationsBound: false,
  pushToken: "",
  pushStatus: "",
  pushError: "",
  pushServerStatus: null,
  socialAuthConfig: null,
  facebookSdkAppId: "",
  pendingGoogleSignupToken: "",
  pendingGoogleSignupProfile: null,
  deviceLocation: null,
  deviceLocationCheckedAt: 0,
  navigationWatchId: null,
  navigationWatchSource: "",
  navigationSession: null,
  navigationLastSentAt: 0,
  navigationLastSentLocation: null,
  navigationLocationStatus: "",
  navigationLocationError: "",
  routeDistanceCache: new Map(),
  validationSyncing: false,
  typingTimer: null,
  typingSent: false,
  presenceTimer: null,
  realtimePollTimer: null,
  conversationPollTimer: null,
  pullRefresh: {
    startY: 0,
    distance: 0,
    active: false,
    refreshing: false,
  },
  call: null,
  adminMetric: "",
  jobFilter: "all",
  activeRole: localStorage.getItem(STORAGE.activeRole) || "",
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
  setupNativeNotifications();
  setupPushNotifications();
  setupOfflineSync();
  setupPullToRefresh();
  initializeTheme();
  bindEvents();
  setupLoginCredentialFill();
  initializeSocketUrl();
  await loadSocialAuthConfig();
  hydratePendingGoogleSignup();
  await loadGeography();
  renderRegisterAddress();
  await loadState();
  syncQueuedValidationEntries();
  const handledSocialRedirect = await handleGoogleRedirectResult();
  if (!handledSocialRedirect) route(initialRoute());
  connectSocket();
  setupMobileUpdateChecks();
  checkMobileUpdate({ force: true });
  consumeNativeLaunchAction();
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

function setupPullToRefresh() {
  const indicator = document.createElement("div");
  indicator.className = "pull-refresh-indicator";
  indicator.setAttribute("aria-live", "polite");
  indicator.innerHTML = `<i class="fa-solid fa-arrow-down"></i><span>Pull to refresh</span>`;
  document.body.appendChild(indicator);

  document.addEventListener("touchstart", (event) => {
    if (!canStartPullRefresh(event)) return;
    state.pullRefresh.startY = event.touches[0].clientY;
    state.pullRefresh.distance = 0;
    state.pullRefresh.active = true;
  }, { passive: true });

  document.addEventListener("touchmove", (event) => {
    if (!state.pullRefresh.active || state.pullRefresh.refreshing) return;
    const distance = Math.max(0, event.touches[0].clientY - state.pullRefresh.startY);
    if (distance <= 0) return;
    state.pullRefresh.distance = Math.min(110, distance * 0.55);
    updatePullRefreshIndicator(indicator);
    if (distance > 12 && window.scrollY <= 0) event.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if (!state.pullRefresh.active) return;
    const shouldRefresh = state.pullRefresh.distance >= 64;
    state.pullRefresh.active = false;
    if (shouldRefresh) {
      runPullRefresh(indicator);
      return;
    }
    state.pullRefresh.distance = 0;
    updatePullRefreshIndicator(indicator);
  }, { passive: true });
}

function canStartPullRefresh(event) {
  if (!state.session || !document.body.classList.contains("app-mode")) return false;
  if (state.pullRefresh.refreshing || window.scrollY > 0) return false;
  const target = event.target;
  if (target?.closest?.(".swal2-container, .chat-shell, input, textarea, select, button, a, [data-no-pull-refresh]")) return false;
  return Boolean(event.touches?.length === 1);
}

function updatePullRefreshIndicator(indicator) {
  const distance = state.pullRefresh.refreshing ? 74 : state.pullRefresh.distance;
  const ready = distance >= 64 || state.pullRefresh.refreshing;
  indicator.classList.toggle("active", distance > 0 || state.pullRefresh.refreshing);
  indicator.classList.toggle("ready", ready);
  indicator.style.transform = `translate(-50%, ${Math.min(76, distance) - 74}px)`;
  indicator.querySelector("i").className = `fa-solid ${state.pullRefresh.refreshing ? "fa-rotate fa-spin" : ready ? "fa-arrow-rotate-right" : "fa-arrow-down"}`;
  indicator.querySelector("span").textContent = state.pullRefresh.refreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh";
}

async function runPullRefresh(indicator) {
  state.pullRefresh.refreshing = true;
  updatePullRefreshIndicator(indicator);
  try {
    await loadState({ silent: true });
    await loadFeed({ silent: true, force: true });
    await Promise.allSettled([
      syncUnreadNotificationSummaries(),
      syncUnreadMessageSummaries(),
      syncPushStatus(),
    ]);
    notify("Refreshed", "KAILA is up to date.", "success");
  } catch (error) {
    notify("Refresh failed", error.message || "Please try again.", "error");
  } finally {
    state.pullRefresh.refreshing = false;
    state.pullRefresh.distance = 0;
    setTimeout(() => updatePullRefreshIndicator(indicator), 160);
  }
}

function setupAttentionNotifications() {
  const markInteraction = () => {
    state.userInteracted = true;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    ensureNativeNotificationPermission();
    resumeAttentionAudio();
  };
  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, markInteraction, { once: true, passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.call && ["incoming", "ringing", "connected", "reconnecting"].includes(state.call.status)) {
      requestCallWakeLock();
    }
    if (document.visibilityState === "visible") handleAppResumed();
  });
  window.addEventListener("focus", handleAppResumed);
}

function handleAppResumed() {
  consumeNativeLaunchAction();
  if (!state.session) return;
  if (!state.socket || !state.connected) connectSocket(!state.socket);
  else syncSocketIdentity();
  syncUnreadNotificationSummaries();
  syncUnreadMessageSummaries();
  refreshStateAfterResume();
}

function refreshStateAfterResume() {
  if (!state.session) return;
  if (Date.now() - state.lastStateRefreshAt < 2500) return;
  loadState({ silent: true }).catch(() => {});
}

async function setupNativeNotifications() {
  const notifications = nativeLocalNotifications();
  if (!notifications) return;
  try {
    await notifications.createChannel({
      id: NATIVE_NOTIFICATION_CHANNELS.updates,
      name: "KAILA updates",
      description: "Job, message, and marketplace updates.",
      importance: 4,
      visibility: 1,
      lights: true,
      lightColor: "#0B4552",
      vibration: true,
      sound: "kaila_notification.wav",
    });
    await notifications.createChannel({
      id: NATIVE_NOTIFICATION_CHANNELS.urgent,
      name: "KAILA urgent alerts",
      description: "Urgent job and support alerts.",
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#F2C66D",
      vibration: true,
      sound: "kaila_notification.wav",
    });
    await notifications.createChannel({
      id: NATIVE_NOTIFICATION_CHANNELS.calls,
      name: "KAILA calls",
      description: "Incoming KAILA audio and video calls.",
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#F2C66D",
      vibration: true,
      sound: "kaila_job_alert.wav",
    });
    await notifications.createChannel({
      id: NATIVE_NOTIFICATION_CHANNELS.jobs,
      name: "KAILA job requests",
      description: "Persistent provider alerts for new matching job requests.",
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#F2C66D",
      vibration: true,
      sound: "kaila_call.wav",
    });
    await notifications.registerActionTypes({
      types: [
        { id: "kaila-call", actions: [{ id: "open-call", title: "Open KAILA" }] },
        { id: "kaila-job-request", actions: [{ id: "job-request", title: "View request" }] },
        { id: "kaila-open", actions: [{ id: "open-notifications", title: "Open KAILA" }] },
      ],
    });
    if (!state.nativeNotificationListenersBound) {
      state.nativeNotificationListenersBound = true;
      notifications.addListener("localNotificationActionPerformed", (event) => {
        const extra = event.notification?.extra || {};
        handleAttentionAction(event.actionId || extra.action || "open-notifications", extra);
      }).catch(() => {});
    }
    state.nativeNotificationsReady = true;
  } catch (error) {
    console.warn("KAILA native notification setup failed:", error);
  }
}

async function ensureNativeNotificationPermission() {
  const notifications = nativeLocalNotifications();
  if (!notifications) return false;
  try {
    const current = await notifications.checkPermissions();
    if (current.display === "granted") return true;
    const requested = await notifications.requestPermissions();
    return requested.display === "granted";
  } catch {
    return false;
  }
}

function nativeLocalNotifications() {
  if (!isNativeApp() && !isCapacitorPluginAvailable("LocalNotifications")) return null;
  return window.Capacitor?.Plugins?.LocalNotifications || null;
}

function nativeKailaBridge() {
  if (!isNativeApp() && !isCapacitorPluginAvailable("KailaNative")) return null;
  return window.Capacitor?.Plugins?.KailaNative || null;
}

function nativePushNotifications() {
  if (!isNativeApp() && !isCapacitorPluginAvailable("PushNotifications")) return null;
  return window.Capacitor?.Plugins?.PushNotifications || null;
}

function isCapacitorPluginAvailable(name) {
  try {
    return Boolean(window.Capacitor?.isPluginAvailable?.(name) || window.Capacitor?.Plugins?.[name]);
  } catch {
    return false;
  }
}

function navigationDebug(step, details = {}) {
  try {
    console.info(`[KAILA navigation] ${step}`, {
      native: isNativeApp(),
      capacitorGeolocation: isCapacitorPluginAvailable("Geolocation"),
      browserGeolocation: Boolean(navigator.geolocation),
      socketConnected: Boolean(state.socket?.connected),
      ...details,
    });
  } catch {
    console.info(`[KAILA navigation] ${step}`);
  }
}

async function nativeFirebaseAvailable() {
  const bridge = nativeKailaBridge();
  if (!bridge?.isFirebaseAvailable) return false;
  try {
    const result = await bridge.isFirebaseAvailable();
    return Boolean(result?.available);
  } catch {
    return false;
  }
}

async function nativeAppInfo() {
  const bridge = nativeKailaBridge();
  if (!bridge?.getAppInfo) return null;
  try {
    return await bridge.getAppInfo();
  } catch {
    return null;
  }
}

async function openExternalUrl(url) {
  if (!url) return;
  const bridge = nativeKailaBridge();
  if (bridge?.openUrl) {
    try {
      await bridge.openUrl({ url });
      return;
    } catch (error) {
      console.warn("KAILA native URL open failed:", error);
    }
  }
  window.open(url, "_blank", "noopener");
}

function mobileUpdateMemory() {
  return readJson(STORAGE.mobileUpdateCheck, {});
}

function rememberMobileUpdateCheck(extra = {}) {
  localStorage.setItem(STORAGE.mobileUpdateCheck, JSON.stringify({ ...mobileUpdateMemory(), checkedAt: Date.now(), ...extra }));
}

function shouldPromptMobileUpdate(latestVersionCode) {
  const memory = mobileUpdateMemory();
  if (Number(memory.promptedVersionCode || 0) !== Number(latestVersionCode)) return true;
  const promptedAt = Number(memory.promptedAt || 0);
  return !promptedAt || Date.now() - promptedAt > MOBILE_UPDATE_PROMPT_INTERVAL_MS;
}

function mobileUpdateUrl() {
  return `${apiBase()}/api/mobile-update?_=${Date.now()}`;
}

function setupMobileUpdateChecks() {
  if (!isNativeApp() || state.mobileUpdateChecksBound) return;
  state.mobileUpdateChecksBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkMobileUpdate();
  });
  window.addEventListener("focus", () => checkMobileUpdate());
}

async function checkMobileUpdate({ force = false } = {}) {
  if (!isNativeApp()) return;
  rememberMobileUpdateCheck();
  try {
    const [info, update] = await Promise.all([
      nativeAppInfo(),
      fetch(mobileUpdateUrl(), { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
    ]);
    const currentVersionCode = Number(info?.versionCode || 0);
    const currentVersionName = String(info?.versionName || "").trim();
    const latestVersionCode = Number(update?.latestVersionCode || 0);
    const latestVersionName = String(update?.latestVersionName || "").trim();
    const versionCodeIsNewer = latestVersionCode > currentVersionCode;
    const publishedVersionDiffers = latestVersionCode === currentVersionCode
      && latestVersionName
      && currentVersionName
      && latestVersionName !== currentVersionName;
    if (!update?.enabled || !update?.apkUrl || !currentVersionCode || (!versionCodeIsNewer && !publishedVersionDiffers)) return;
    rememberMobileUpdateCheck({ latestVersionCode });
    if (!force && !shouldPromptMobileUpdate(latestVersionCode)) return;
    rememberMobileUpdateCheck({ promptedVersionCode: latestVersionCode, promptedAt: Date.now() });
    promptMobileUpdate({ ...update, currentVersionCode, currentVersionName });
  } catch (error) {
    console.warn("KAILA mobile update check failed:", error);
  }
}

async function promptMobileUpdate(update = {}) {
  const current = update.currentVersionName
    ? `${update.currentVersionName} (${update.currentVersionCode})`
    : `Version ${update.currentVersionCode}`;
  const latest = update.latestVersionName
    ? `${update.latestVersionName} (${update.latestVersionCode})`
    : `Version ${update.latestVersionCode}`;
  const notes = update.releaseNotes ? `<p>${escapeHtml(update.releaseNotes)}</p>` : "";
  const result = await modal({
    icon: "info",
    title: "KAILA update available",
    html: `
      <div class="text-start">
        <p>A newer Android app is ready.</p>
        <p><strong>Installed:</strong> ${escapeHtml(current)}<br><strong>Latest:</strong> ${escapeHtml(latest)}</p>
        ${notes}
      </div>
    `,
    confirmButtonText: "Download Update",
    cancelButtonText: "Later",
  });
  if (result.isConfirmed) openExternalUrl(update.apkUrl);
}

function isNativeApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.getPlatform?.() === "android" || window.Capacitor?.getPlatform?.() === "ios");
}

function handleAttentionAction(action, data = {}) {
  if (["answer-call", "decline-call"].includes(action)) {
    handleNativeCallAction({ action, ...data });
    return;
  }
  if (action === "job-request") {
    handlePushAction({ action, ...data });
    return;
  }
  if (["message", "direct-message", "request", "offer", "job"].includes(action)) {
    handlePushAction({ action, ...data });
    return;
  }
  if (action === "open-call" && state.call?.status === "incoming") {
    route("app");
    setCallMinimized(false);
    return;
  }
  if (action === "open-call") {
    route("app");
    return;
  }
  if (action === "open-notifications") openNotificationBell();
}

async function consumeNativeLaunchAction() {
  const bridge = nativeKailaBridge();
  if (!bridge?.consumeLaunchAction) return;
  try {
    const payload = await bridge.consumeLaunchAction();
    if (payload?.url && await handleNativeOAuthLaunchUrl(payload.url)) return;
    if (payload?.action) handlePushAction({ action: payload.action, callId: payload.id || "", id: payload.id || "" });
  } catch (error) {
    console.warn("KAILA native launch action failed:", error);
  }
}

async function setupPushNotifications() {
  const push = nativePushNotifications();
  if (!push) {
    state.pushStatus = isNativeApp() ? "Push plugin unavailable" : "Not a native app";
    renderAttentionBadges();
    return;
  }
  if (state.pushNotificationsBound) return;
  try {
    const firebaseAvailable = await nativeFirebaseAvailable();
    state.pushStatus = firebaseAvailable ? "Firebase available" : "Registering with PushNotifications";
    state.pushNotificationsBound = true;
    await push.addListener("registration", (token) => {
      state.pushToken = token.value || "";
      state.pushStatus = state.pushToken ? "Token registered on device" : "Registration returned no token";
      state.pushError = "";
      registerPushToken(state.pushToken).catch((error) => console.warn("KAILA push token registration failed:", error));
      renderSettings();
    });
    await push.addListener("registrationError", (error) => {
      state.pushStatus = "Registration failed";
      state.pushError = error?.error || error?.message || JSON.stringify(error || {});
      console.warn("KAILA push registration error:", error);
      renderSettings();
    });
    await push.addListener("pushNotificationReceived", (notification) => {
      handlePushNotification(notification);
    });
    await push.addListener("pushNotificationActionPerformed", (event) => {
      handlePushAction(event.notification?.data || event.notification || {});
      consumeNativeLaunchAction();
    });
    const permission = await push.checkPermissions();
    const nextPermission = permission.receive === "prompt" ? await push.requestPermissions() : permission;
    state.pushStatus = `Permission: ${nextPermission.receive || "unknown"}`;
    if (nextPermission.receive === "granted") await push.register();
    else renderSettings();
  } catch (error) {
    state.pushStatus = "Push setup failed";
    state.pushError = error?.message || String(error);
    console.warn("KAILA push setup failed:", error);
    renderSettings();
  }
}

async function registerPushToken(token) {
  if (!token || !state.session) return;
  const response = await apiFetch("/api/push-token", {
    method: "POST",
    body: JSON.stringify({
      token,
      platform: window.Capacitor?.getPlatform?.() || "android",
      deviceId: pushDeviceId(),
    }),
    silentError: true,
  });
  state.pushStatus = response?.tokenCount ? `Server registered ${response.tokenCount} device${response.tokenCount === 1 ? "" : "s"}` : "Server registered device";
  await syncPushStatus();
  renderSettings();
}

async function syncPushStatus() {
  if (!state.session) return null;
  try {
    const status = await apiFetch("/api/push-status", { method: "GET", silentError: true });
    state.pushServerStatus = status;
    return status;
  } catch (error) {
    state.pushServerStatus = { error: error.message || "Push status unavailable" };
    return state.pushServerStatus;
  }
}

function pushDeviceId() {
  let id = localStorage.getItem(STORAGE.pushDeviceId);
  if (!id) {
    id = createBrowserId();
    localStorage.setItem(STORAGE.pushDeviceId, id);
  }
  return id;
}

function handlePushNotification(notification = {}) {
  const data = notification.data || notification;
  if (data.type === "request-clear" || data.action === "clear-job-request") {
    clearJobRequestNotification(data.requestId || data.id || "");
  } else if (data.type === "call") {
    showNativeIncomingCall(data.callerName || "Your job contact", data.callType || "audio").catch(() => {});
  } else if (data.type === "message" || data.action === "message") {
    addUnreadMessage({
      type: "job",
      id: data.requestId || data.id || "",
      title: data.title || "Job message",
      sender: data.senderName || "KAILA",
      detail: data.body || notification.body || "",
      createdAt: data.createdAt || new Date().toISOString(),
    });
  } else if (data.type === "direct-message" || data.action === "direct-message") {
    addUnreadMessage({
      type: "direct",
      id: directConversationMessageKey(data.userId || data.senderId || data.id || "", data.requestId || ""),
      userId: data.userId || data.senderId || data.id || "",
      requestId: data.requestId || "",
      title: data.title || "Direct message",
      sender: data.senderName || "KAILA",
      detail: data.body || notification.body || "",
      createdAt: data.createdAt || new Date().toISOString(),
    });
  } else if (data.title || notification.title) {
    addUnreadNotification(notificationItemFromPushData(data, notification));
    renderAttentionBadges();
  }
}

async function handlePushAction(data = {}) {
  const action = data.action || data.type;
  if (["answer-call", "decline-call"].includes(action)) {
    handleNativeCallAction(data);
    return;
  }
  if (action === "clear-job-request" || data.type === "request-clear") {
    clearJobRequestNotification(data.requestId || data.id || "");
    return;
  }
  if (action === "call" || action === "open-call") {
    state.pendingNativeCallId = data.callId || data.id || "";
    route("app");
    setCallMinimized(false);
    return;
  }
  if (action === "message") {
    await openMessageFromNotification(data);
  } else if (action === "direct-message") {
    await openDirectMessageFromNotification(data);
  }
  else if (action === "request" || action === "job-request" || action === "offer" || action === "job") {
    await openRequestFromNotification(data);
  } else {
    openNotificationBell();
  }
}

async function openMessageFromNotification(data = {}) {
  const requestId = data.requestId || data.id || "";
  route("app");
  if (!requestId) {
    activateTab("#inbox-pane");
    return;
  }
  await loadState({ silent: true });
  if (state.requests.some((request) => request.id === requestId)) {
    openConversation(requestId);
  } else {
    activateTab("#inbox-pane");
  }
}

async function openDirectMessageFromNotification(data = {}) {
  const userId = data.userId || data.senderId || data.id || "";
  const requestId = data.requestId || "";
  route("app");
  if (!userId) {
    activateTab("#inbox-pane");
    return;
  }
  await loadState({ silent: true });
  openDirectConversation(userId, requestId);
}

async function openRequestFromNotification(data = {}) {
  const requestId = data.requestId || data.id || "";
  route("app");
  clearJobRequestNotification(requestId);
  await loadState({ silent: true });
  const request = state.requests.find((item) => item.id === requestId);
  if (request && shouldUseProviderModeForRequest(request)) activateProviderMode();
  activateTab("#requests-pane");
  if (request) {
    focusRequestCard(requestId, data.offerId || "");
    return;
  }
  renderRequests();
  if (requestId) notify("Job request", "This request is no longer available or no longer matches your provider profile.", "info");
}

function handleNativeCallAction(data = {}) {
  const action = data.action || "";
  const callId = data.callId || data.id || "";
  state.pendingNativeCallAction = action;
  state.pendingNativeCallId = callId;
  route("app");
  setCallMinimized(false);
  if (!state.call || (callId && state.call.callId !== callId)) return;
  if (action === "answer-call") acceptAudioCall();
  if (action === "decline-call") declineAudioCall();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isNativeAppOrigin()) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations?.()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {});
      window.caches?.keys?.()
        .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
        .catch(() => {});
    });
    return;
  }
  if (!state.notificationClicksBound) {
    state.notificationClicksBound = true;
    navigator.serviceWorker.addEventListener("message", (event) => {
      handleAttentionAction(event.data?.action, event.data || {});
    });
  }
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
  $("[data-feed-form]")?.addEventListener("submit", createFeedPost);
  bindAttachmentPreview("[data-feed-media]", "[data-feed-media-preview]", 1);
  bindFeedAudienceSelector();
  $$("[data-password-toggle]").forEach((button) => button.addEventListener("click", togglePasswordVisibility));
  $("[data-forgot-password]")?.addEventListener("click", openForgotPasswordModal);
  $$("[data-logout]").forEach((button) => button.addEventListener("click", logout));
  $$("[data-social-provider]").forEach((button) => button.addEventListener("click", () => handleSocialAuth(button.dataset.socialProvider, button.dataset.socialMode)));
  $("[data-open-live]").addEventListener("click", () => $("[data-live-panel]").hidden = false);
  $("[data-close-live]").addEventListener("click", () => $("[data-live-panel]").hidden = true);
  $("[data-reconnect]").addEventListener("click", () => connectSocket(true));
  $("[data-notification-bell]")?.addEventListener("click", openNotificationBell);
  $("[data-message-bell]")?.addEventListener("click", openMessageBell);
  $$("[data-new-request]").forEach((button) => button.addEventListener("click", openRequestModal));
  $$("[data-home-tab]").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.homeTab)));
  $$("[data-home-support]").forEach((button) => button.addEventListener("click", openCustomerServicePlatform));
  $("[data-home-search]")?.addEventListener("input", applyHomeSearch);
  $("[data-home-search]")?.addEventListener("search", applyHomeSearch);
  $$("[data-service-category]").forEach((button) => button.addEventListener("click", () => {
    openRequestModal();
    setTimeout(() => {
      const category = $("#request-category");
      if (category && [...category.options].some((option) => option.value === button.dataset.serviceCategory)) {
        category.value = button.dataset.serviceCategory;
      }
    }, 50);
  }));
  $("[data-settings-tab]")?.addEventListener("shown.bs.tab", renderSettings);
  $("[data-settings-tab]")?.addEventListener("click", renderSettings);
  $("[data-activity-tab]")?.addEventListener("shown.bs.tab", clearUnreadNotifications);
  $("[data-activity-tab]")?.addEventListener("click", clearUnreadNotifications);
  $$(".app-tabs .nav-link").forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => rememberDashboardTab(tab.dataset.bsTarget));
    tab.addEventListener("click", () => rememberDashboardTab(tab.dataset.bsTarget));
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-feed-audience]")) closeFeedAudienceMenus();
    if (!event.target.closest(".feed-post-more")) closeFeedPostMoreMenus();
    if (!event.target.closest(".feed-comment-more, [data-feed-comment-floating-menu]")) closeFeedCommentMoreMenus();
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
  document.documentElement.dataset.bsTheme = resolved;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", resolved === "dark" ? "#020617" : "#2563EB");
}

function initializeSocketUrl() {
  const input = $("[data-socket-url]");
  const savedUrl = localStorage.getItem(STORAGE.socketUrl) || "";
  input.value = normalizeSocketUrl(savedUrl) || defaultSocketUrl();
  localStorage.setItem(STORAGE.socketUrl, input.value);
}

async function loadGeography() {
  if (!window.XLSX) return;
  try {
    const sources = await Promise.all(GEOGRAPHY_SOURCES.map(async (source) => {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Geography source unavailable: ${source}`);
      const workbook = window.XLSX.read(await response.arrayBuffer(), { type: "array" });
      return geographyRowsFromWorkbook(workbook);
    }));
    const regions = [];
    const provinces = [];
    const cities = [];
    const provinceRegions = {};
    const provinceCities = {};
    const cityRegions = {};
    const cityProvinces = {};
    const cityBarangays = {};
    sources.forEach((rows) => {
      let currentRegion = "";
      let currentProvince = "";
      let currentCity = "";
      rows.forEach((row) => {
        const level = String(row["Geographic Level"] || "").trim();
        const name = String(row.Name || "").trim();
        if (!level || !name) return;
        if (level === "Reg") {
          currentRegion = name;
          currentProvince = "";
          currentCity = "";
          regions.push(name);
        } else if (level === "Prov") {
          currentProvince = name;
          currentCity = "";
          provinces.push(name);
          if (currentRegion) provinceRegions[name] = currentRegion;
          provinceCities[name] = provinceCities[name] || [];
        } else if (["City", "Mun"].includes(level)) {
          currentCity = name;
          const province = currentProvince || INDEPENDENT_CITY_PROVINCE;
          provinces.push(province);
          cities.push(name);
          if (currentRegion) cityRegions[name] = currentRegion;
          if (currentRegion) provinceRegions[province] = currentRegion;
          cityProvinces[name] = province;
          provinceCities[province] = provinceCities[province] || [];
          provinceCities[province].push(name);
          cityBarangays[name] = cityBarangays[name] || [];
        } else if (level === "Bgy" && currentCity) {
          cityBarangays[currentCity].push(name);
        }
      });
    });
    const barangays = sortedBarangays(Object.values(cityBarangays).flat());
    if (cities.length && barangays.length) {
      const defaultCity = cities.includes(FALLBACK_GEOGRAPHY.city) ? FALLBACK_GEOGRAPHY.city : cities[0];
      const defaultProvince = cityProvinces[defaultCity] || FALLBACK_GEOGRAPHY.province || INDEPENDENT_CITY_PROVINCE;
      state.geography = {
        region: cityRegions[defaultCity] || regions[0] || FALLBACK_GEOGRAPHY.region,
        province: defaultProvince,
        city: defaultCity,
        regions: sortedBarangays(regions),
        provinces: sortedBarangays(provinces),
        cities: sortedBarangays(cities),
        provinceRegions,
        provinceCities: Object.fromEntries(Object.entries(provinceCities).map(([province, items]) => [province, sortedBarangays(items)])),
        cityRegions,
        cityProvinces,
        cityBarangays: Object.fromEntries(Object.entries(cityBarangays).map(([city, items]) => [city, sortedBarangays(items)])),
        barangays,
      };
    }
  } catch (error) {
    console.warn("KAILA geography source failed; using fallback geography.", error);
  }
}

function geographyRowsFromWorkbook(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (rows.some((row) => row["Geographic Level"] && row.Name)) return rows;
  }
  return [];
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
  const configured = $("[data-socket-url]")?.value.trim().replace(/\/$/, "");
  return configured || defaultSocketUrl();
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
    state.lastStateRefreshAt = Date.now();
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
  state.reports = payload.reports || [];
  state.blocks = payload.blocks || [];
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
  ensureActiveRole();
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
  if (!APP_ROUTES.includes(name)) name = state.session ? "app" : "landing";
  if (name === "app" && !state.session) name = "login";
  if (state.session && ["landing", "login", "register", "public-post"].includes(name)) name = "app";
  $$("[data-view]").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  document.body.classList.toggle("app-mode", name === "app");
  toggleProviderCategory();
  if (name === "login") hydrateSavedLoginCredentials();
  if (name === "app" && state.session) loadFeed({ silent: true }).catch(() => {});
  if (name === "public-post") loadPublicPost().catch(() => {});
  render();
}

function initialRoute() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("route") || window.location.hash.replace(/^#\/?/, "");
  const postId = params.get("post") || params.get("feedPost") || "";
  if (postId && !state.session) {
    state.publicPostId = postId;
    return "public-post";
  }
  return APP_ROUTES.includes(requested) ? requested : (state.session ? "app" : "landing");
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
  state.activeRole = defaultActiveRole();
  state.lastDashboardTabTarget = "#feed-pane";
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  localStorage.setItem(STORAGE.activeRole, state.activeRole);
  loadAttentionBadgesForSession();
  syncSocketIdentity();
  safeApplyState(payload.state);
  activateTab("#feed-pane");
  form.reset();
  runPostAuthTasks(data.username, data.password, payload.user);
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
      persistSavedLoginChoice(data);
      form.reset();
      return;
    }
    notify("Login failed", error.message, "error");
    return;
  }

  state.session = payload.user;
  state.activeRole = defaultActiveRole();
  state.lastDashboardTabTarget = "#feed-pane";
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  localStorage.setItem(STORAGE.activeRole, state.activeRole);
  loadAttentionBadgesForSession();
  syncSocketIdentity();
  safeApplyState(payload.state);
  activateTab("#feed-pane");
  persistSavedLoginChoice(data);
  form.reset();
  runPostAuthTasks(data.username, data.password, payload.user);
  await successRedirect("Logged in", `Welcome back, ${displayUserName(state.session)}.`);
}

async function loadSocialAuthConfig() {
  try {
    state.socialAuthConfig = await apiFetch("/api/auth/config");
    renderSocialAuthButtons();
  } catch (error) {
    console.warn("Social auth config unavailable:", error.message);
    state.socialAuthConfig = {};
    renderSocialAuthButtons();
  }
}

function renderSocialAuthButtons() {
  const config = state.socialAuthConfig || {};
  $$("[data-social-auth]").forEach((row) => {
    const hasAny = Boolean(config.googleClientId || config.facebookAppId);
    row.hidden = !hasAny;
    const google = $('[data-social-provider="google"]', row);
    const facebook = $('[data-social-provider="facebook"]', row);
    if (google) google.hidden = !config.googleClientId;
    if (facebook) facebook.hidden = !config.facebookAppId;
  });
}

function socialAuthPayloadFromRegisterForm(form = $("[data-register-form]")) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.name = String(data.name || "").trim();
  data.email = String(data.email || "").trim();
  data.username = String(data.username || "").trim();
  data.category = selectedCategoryChips("register-category");
  data.area = addressValue("register-address");
  data.availableDays = selectedCategoryChips("register-days").join(", ");
  data.availableTime = timeRangeValue("[data-register-form] [name='availableTimeStart']", "[data-register-form] [name='availableTimeEnd']");
  data.coverageArea = selectedCategoryChips("register-coverage").join(", ");
  data.minimumFee = normalizeCurrencyInput(data.minimumFee);
  data.priceRange = priceRangeValue("[data-register-form] [name='priceRangeMin']", "[data-register-form] [name='priceRangeMax']");
  data.dataPrivacyConsent = form.elements.dataPrivacyConsent?.checked;
  data.validIdConsent = form.elements.validIdConsent?.checked;
  data.consentRequests = form.elements.consentRequests?.checked;
  data.consentRatings = form.elements.consentRatings?.checked;
  data.rulesAgreement = form.elements.rulesAgreement?.checked;
  delete data.password;
  delete data.availableTimeStart;
  delete data.availableTimeEnd;
  delete data.priceRangeMin;
  delete data.priceRangeMax;
  return data;
}

function applySocialProfileToRegister(profile = {}) {
  const form = $("[data-register-form]");
  if (!form) return;
  if (profile.name && !form.elements.name.value) form.elements.name.value = profile.name;
  if (profile.email && !form.elements.email.value) form.elements.email.value = profile.email;
  if (profile.username && !form.elements.username.value) form.elements.username.value = profile.username;
}

function validateSocialSignup(data = {}) {
  if (!data.name || !data.contactNumber || !data.preferredContactChannel || !data.area || !data.dataPrivacyConsent) {
    notify("Signup incomplete", "Name, contact number, preferred contact, address, and consent are required.", "warning");
    return false;
  }
  if (data.role === "provider" && (!data.category.length || !data.specificServices || !data.coverageArea || !data.consentRequests || !data.consentRatings || !data.rulesAgreement)) {
    notify("Signup incomplete", "Provider category, services, coverage area, request consent, rating consent, and rules agreement are required.", "warning");
    return false;
  }
  return true;
}

async function handleSocialAuth(provider, mode = "login") {
  if (provider === "google") {
    try {
      await startGoogleRedirectAuth(mode);
    } catch (error) {
      notify("Google sign-in failed", socialAuthErrorMessage(error), "error");
    }
    return;
  }
  if (provider === "facebook" && canUseNativeFacebookLogin()) {
    try {
      await startNativeFacebookRedirectAuth(mode);
    } catch (error) {
      notify("Facebook sign-in failed", socialAuthErrorMessage(error), "error");
    }
    return;
  }
  try {
    const token = await socialProviderToken(provider);
    return completeSocialAuthWithToken(provider, token, mode);
  } catch (error) {
    notify("Social sign-in cancelled", socialAuthErrorMessage(error), "warning");
  }
}

async function completeSocialAuthWithToken(provider, token, mode = "login") {
  try {
    const body = { provider, token, mode };
    if (mode === "signup") {
      const role = $("[data-register-form] [name='role']")?.value;
      if (role) body.role = role;
    }
    const payload = await apiFetch("/api/auth/social", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!payload.user?.id) {
      throw new Error(payload.message || "KAILA did not return an account session. Try again after the API update is running.");
    }
    if (provider === "google") forgetPendingGoogleSignup();
    const created = Boolean(payload.created);
    await completeAuthenticatedSession(payload, created ? "Account created" : "Logged in", created ? "Welcome to KAILA. You can finish your profile in Settings." : `Welcome back, ${displayUserName(payload.user)}.`);
  } catch (error) {
    notify("Social sign-in failed", socialAuthErrorMessage(error), "error");
  }
}

function socialAuthErrorMessage(error = {}) {
  if (error.status === 400 || error.status === 401) return "The provider could not verify this sign-in. Try again or use username/password.";
  return error.message || "Social sign-in could not be completed.";
}

async function completeAuthenticatedSession(payload, title, message) {
  if (!payload.user?.id) throw new Error("KAILA did not return an account session.");
  state.session = payload.user;
  state.activeRole = defaultActiveRole();
  state.lastDashboardTabTarget = "#feed-pane";
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  localStorage.setItem(STORAGE.activeRole, state.activeRole);
  loadAttentionBadgesForSession();
  syncSocketIdentity();
  activateTab("#feed-pane");
  route("app");
  safeApplyState(payload.state);
  runPostAuthTasks("", "", payload.user);
  await successRedirect(title, message);
}

async function socialProviderToken(provider) {
  if (provider === "google") throw new Error("Google sign-in redirects to Google before returning to KAILA.");
  if (provider === "facebook") return facebookAccessToken();
  throw new Error("Unsupported social provider");
}

function loadScriptOnce(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = $$("script").find((script) => script.src === src);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if (globalName && window[globalName]) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load social sign-in script"));
    document.head.appendChild(script);
  });
}

function googleRedirectUri() {
  return isNativeAppOrigin() ? `https://${PRODUCTION_HOST}/` : `${window.location.origin}${window.location.pathname}`;
}

function facebookRedirectUri() {
  return isNativeAppOrigin() ? `https://${PRODUCTION_HOST}/` : `${window.location.origin}${window.location.pathname}`;
}

async function startGoogleRedirectAuth(mode = "login") {
  const clientId = state.socialAuthConfig?.googleClientId;
  if (!clientId) throw new Error("Google login is not configured");
  const marker = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pendingKey = `${SOCIAL_AUTH_PENDING_PREFIX}${marker}`;
  const pending = JSON.stringify({ provider: "google", mode, createdAt: Date.now() });
  sessionStorage.setItem(pendingKey, pending);
  if (isNativeAppOrigin()) localStorage.setItem(pendingKey, pending);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", marker);
  if (isNativeAppOrigin()) {
    const bridge = nativeKailaBridge();
    if (!bridge?.openUrl) throw new Error("Native browser login is unavailable");
    await bridge.openUrl({ url: url.toString() });
    return;
  }
  window.location.assign(url.toString());
}

async function handleGoogleRedirectResult() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const marker = params.get("state") || "";
  const pendingKey = marker ? `${SOCIAL_AUTH_PENDING_PREFIX}${marker}` : "";
  const pending = pendingKey ? (readSessionJson(pendingKey, null) || readJson(pendingKey, null)) : null;
  if (pending?.provider !== "google") return false;
  sessionStorage.removeItem(pendingKey);
  localStorage.removeItem(pendingKey);
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  if (params.get("error")) {
    notify("Google sign-in cancelled", params.get("error_description") || params.get("error") || "Google did not complete sign-in.", "warning");
    return true;
  }
  const token = params.get("access_token");
  if (!token) {
    notify("Google sign-in failed", "Google did not return an access token.", "error");
    return true;
  }
  await completeSocialAuthWithToken("google", token, pending.mode || "login");
  return true;
}

async function prepareGoogleSignupFromToken(token) {
  try {
    const profileResponse = await apiFetch("/api/auth/social/profile", {
      method: "POST",
      body: JSON.stringify({ provider: "google", token }),
    });
    rememberPendingGoogleSignup(token, profileResponse.profile);
    applySocialProfileToRegister(profileResponse.profile);
  } catch (error) {
    console.warn("KAILA could not preload Google profile for signup:", error);
  }
}

function rememberPendingGoogleSignup(token, profile = null) {
  state.pendingGoogleSignupToken = token || "";
  state.pendingGoogleSignupProfile = profile || null;
  if (token) sessionStorage.setItem(SOCIAL_AUTH_GOOGLE_PROFILE_TOKEN, JSON.stringify({ token, profile, createdAt: Date.now() }));
}

function hydratePendingGoogleSignup() {
  const saved = readSessionJson(SOCIAL_AUTH_GOOGLE_PROFILE_TOKEN, null);
  if (!saved?.token || Date.now() - Number(saved.createdAt || 0) > 50 * 60 * 1000) {
    sessionStorage.removeItem(SOCIAL_AUTH_GOOGLE_PROFILE_TOKEN);
    return;
  }
  state.pendingGoogleSignupToken = saved.token;
  state.pendingGoogleSignupProfile = saved.profile || null;
}

function forgetPendingGoogleSignup() {
  state.pendingGoogleSignupToken = "";
  state.pendingGoogleSignupProfile = null;
  sessionStorage.removeItem(SOCIAL_AUTH_GOOGLE_PROFILE_TOKEN);
}

async function facebookAccessToken() {
  const appId = state.socialAuthConfig?.facebookAppId;
  if (!appId) throw new Error("Facebook login is not configured");
  await ensureFacebookSdk(appId);
  return new Promise((resolve, reject) => {
    window.FB.login((response) => {
      if (response.authResponse?.accessToken) resolve(response.authResponse.accessToken);
      else reject(new Error("Facebook sign-in was cancelled"));
    }, { scope: "public_profile,email", auth_type: "rerequest", return_scopes: true });
  });
}

function canUseNativeFacebookLogin() {
  return Boolean(isNativeApp() && nativeKailaBridge()?.openFacebookLogin && state.socialAuthConfig?.facebookAppId);
}

async function startNativeFacebookRedirectAuth(mode = "login") {
  const appId = state.socialAuthConfig?.facebookAppId;
  const bridge = nativeKailaBridge();
  if (!appId || !bridge?.openFacebookLogin) throw new Error("Facebook login is not configured");
  const marker = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pending = JSON.stringify({ provider: "facebook", mode, createdAt: Date.now() });
  sessionStorage.setItem(`${SOCIAL_AUTH_FACEBOOK_PENDING_PREFIX}${marker}`, pending);
  localStorage.setItem(`${SOCIAL_AUTH_FACEBOOK_PENDING_PREFIX}${marker}`, pending);
  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", facebookRedirectUri());
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "public_profile,email");
  url.searchParams.set("auth_type", "rerequest");
  url.searchParams.set("return_scopes", "true");
  url.searchParams.set("state", marker);
  await bridge.openFacebookLogin({ url: url.toString(), preferBrowser: true });
}

async function handleNativeOAuthLaunchUrl(url = "") {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.hostname !== PRODUCTION_HOST) return false;
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const queryParams = parsed.searchParams;
  const marker = hashParams.get("state") || queryParams.get("state") || "";
  const pendingCandidates = marker
    ? [`${SOCIAL_AUTH_PENDING_PREFIX}${marker}`, `${SOCIAL_AUTH_FACEBOOK_PENDING_PREFIX}${marker}`]
    : [];
  const pendingEntry = pendingCandidates
    .map((key) => ({ key, value: readSessionJson(key, null) || readJson(key, null) }))
    .find((entry) => entry.value?.provider === "google" || entry.value?.provider === "facebook");
  if (!pendingEntry) return false;
  const { key: pendingKey, value: pending } = pendingEntry;
  sessionStorage.removeItem(pendingKey);
  localStorage.removeItem(pendingKey);
  const providerLabel = pending.provider === "google" ? "Google" : "Facebook";
  const error = hashParams.get("error") || queryParams.get("error");
  if (error) {
    notify(`${providerLabel} sign-in cancelled`, hashParams.get("error_description") || queryParams.get("error_description") || error || `${providerLabel} did not complete sign-in.`, "warning");
    return true;
  }
  const token = hashParams.get("access_token") || queryParams.get("access_token");
  if (!token) {
    notify(`${providerLabel} sign-in failed`, `${providerLabel} did not return an access token.`, "error");
    return true;
  }
  await completeSocialAuthWithToken(pending.provider, token, pending.mode || "login");
  return true;
}

async function ensureFacebookSdk(appId) {
  await loadScriptOnce("https://connect.facebook.net/en_US/sdk.js", "FB");
  if (state.facebookSdkAppId === appId) return;
  window.FB.init({
    appId,
    cookie: false,
    status: false,
    xfbml: false,
    version: "v20.0",
  });
  state.facebookSdkAppId = appId;
}

function runPostAuthTasks(username, password, user) {
  Promise.allSettled([
    rememberOfflineLogin(username, password, user),
    offerPasswordSave(username, password, user),
    registerPushToken(state.pushToken),
    syncPushStatus(),
    syncUnreadNotificationSummaries(),
    syncUnreadMessageSummaries(),
  ]).then((results) => {
    results.forEach((result) => {
      if (result.status === "rejected") console.warn("KAILA post-login task failed:", result.reason);
    });
  });
}

function setupLoginCredentialFill() {
  const form = $("[data-login-form]");
  if (!form) return;
  if (isNativeApp()) suppressNativePasswordManager(form);
  hydrateSavedLoginCredentials(form);
  bindSavedLoginControls(form);
  hydratePasswordManagerCredentials(form);
}

function suppressNativePasswordManager(form) {
  form.setAttribute("autocomplete", "off");
  form.elements.username?.setAttribute("autocomplete", "off");
  form.elements.password?.setAttribute("autocomplete", "new-password");
}

function hydrateSavedLoginCredentials(form = $("[data-login-form]")) {
  if (!form) return;
  const saved = savedLoginCredentials();
  const remember = form.elements.rememberLogin;
  if (remember) remember.checked = Boolean(saved);
  const forgetButton = $("[data-forget-saved-login]", form);
  if (forgetButton) forgetButton.hidden = !saved;
  if (!saved) return;
  if (form.elements.username && !form.elements.username.value) form.elements.username.value = saved.username;
  if (form.elements.password && !form.elements.password.value) form.elements.password.value = saved.password;
}

function bindSavedLoginControls(form) {
  const remember = form.elements.rememberLogin;
  const forgetButton = $("[data-forget-saved-login]", form);
  remember?.addEventListener("change", () => {
    if (remember.checked) return;
    clearSavedLogin(form, { notifyUser: true });
  });
  forgetButton?.addEventListener("click", () => clearSavedLogin(form, { notifyUser: true, clearUsername: true }));
}

async function hydratePasswordManagerCredentials(form = $("[data-login-form]")) {
  if (isNativeApp()) return;
  if (!navigator.credentials?.get || !window.PasswordCredential || !form) return;
  try {
    const credential = await navigator.credentials.get({ password: true, mediation: "optional" });
    if (!credential || credential.type !== "password") return;
    if (form.elements.username && !form.elements.username.value) form.elements.username.value = credential.id || "";
    if (form.elements.password && !form.elements.password.value) form.elements.password.value = credential.password || "";
  } catch {}
}

async function offerPasswordSave(username, password, user = {}) {
  if (isNativeApp()) return;
  if (!navigator.credentials?.store || !window.PasswordCredential || !username || !password) return;
  try {
    const credential = new window.PasswordCredential({
      id: String(username),
      password: String(password),
      name: displayUserName(user) || String(username),
      iconURL: new URL("assets/android-chrome-192x192.png", window.location.href).href,
    });
    await navigator.credentials.store(credential);
  } catch {}
}

function persistSavedLoginChoice(data = {}) {
  const form = $("[data-login-form]");
  const remember = form?.elements?.rememberLogin;
  if (!remember?.checked) {
    localStorage.removeItem(STORAGE.savedLogin);
    updateSavedLoginControls(form);
    return;
  }
  const username = String(data.username || "").trim();
  const password = String(data.password || "");
  if (!username || !password) return;
  localStorage.setItem(STORAGE.savedLogin, JSON.stringify({
    username,
    password,
    updatedAt: new Date().toISOString(),
  }));
  updateSavedLoginControls(form);
}

function savedLoginCredentials() {
  const saved = readJson(STORAGE.savedLogin, null);
  if (!saved || typeof saved !== "object") return null;
  const username = String(saved.username || "").trim();
  const password = String(saved.password || "");
  if (!username || !password) return null;
  return { username, password };
}

function clearSavedLogin(form = $("[data-login-form]"), options = {}) {
  localStorage.removeItem(STORAGE.savedLogin);
  if (options.clearUsername && form?.elements?.username) form.elements.username.value = "";
  if (form?.elements?.password) form.elements.password.value = "";
  updateSavedLoginControls(form);
  if (options.notifyUser) notify("Saved login cleared", "KAILA removed the saved password from this device.", "success");
}

function updateSavedLoginControls(form = $("[data-login-form]")) {
  const saved = savedLoginCredentials();
  const forgetButton = form ? $("[data-forget-saved-login]", form) : null;
  if (forgetButton) forgetButton.hidden = !saved;
  if (form?.elements?.rememberLogin) form.elements.rememberLogin.checked = Boolean(saved);
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
  state.feedPosts = [];
  state.feedLoaded = false;
  state.lastDashboardTabTarget = "#feed-pane";
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
  syncNavigationSessionAvailability();
  renderNav();
  renderTabs();
  renderActions();
  renderFeed();
  renderPublicPost();
  renderRequests();
  renderProviders();
  renderClients();
  renderCustomerService();
  renderInbox();
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
  if (signedIn) $("[data-current-user]").textContent = `${displayUserName(state.session)} (${roleLabel(state.session.role)})`;
  const summary = $("[data-current-user-summary]");
  if (summary && signedIn) summary.textContent = `${displayUserName(state.session)} - ${state.session.area || roleLabel(state.session.role)}`;
  const userPhoto = $("[data-app-user-photo]");
  if (userPhoto) {
    userPhoto.src = signedIn ? resolveMediaUrl(state.session.photoUrl) : "assets/android-chrome-192x192.png";
    userPhoto.alt = signedIn ? `${displayUserName(state.session)} photo` : "";
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
  const feedTab = $("[data-feed-tab]");
  const requestsTab = $("[data-requests-tab]");
  const providersTab = $("[data-providers-tab]");
  const clientsTab = $("[data-clients-tab]");
  const customerServiceTab = $("[data-customer-service-tab]");
  const inboxTab = $("[data-inbox-tab]");
  const opsTab = $("[data-ops-tab]");
  const activityTab = $("[data-activity-tab]");
  const validationTab = $("[data-validation-tab]");
  if (!providersTab) return;
  const isOps = state.session?.role === "ops";
  const isSupport = state.session?.role === SUPPORT_ROLE;
  const canViewActivity = ["admin", SUPPORT_ROLE].includes(state.session?.role);
  const hideProviders = isOps;
  if (feedTab) feedTab.hidden = false;
  if (requestsTab) requestsTab.hidden = isOps;
  providersTab.hidden = hideProviders;
  if (clientsTab) clientsTab.hidden = !["admin", SUPPORT_ROLE].includes(state.session?.role);
  if (customerServiceTab) customerServiceTab.hidden = !["admin", "client", "provider", SUPPORT_ROLE].includes(state.session?.role);
  if (inboxTab) inboxTab.hidden = state.session?.role === "ops";
  if (opsTab) opsTab.hidden = state.session?.role !== "admin";
  if (activityTab) activityTab.hidden = !canViewActivity;
  if (validationTab) validationTab.hidden = !["admin", "ops"].includes(state.session?.role);
  if (hideProviders && providersTab.querySelector(".nav-link")?.classList.contains("active")) {
    activateTab("#feed-pane");
  }
  if (!["admin", SUPPORT_ROLE].includes(state.session?.role) && clientsTab?.classList.contains("active")) activateTab("#feed-pane");
  if (!["admin", "client", "provider", SUPPORT_ROLE].includes(state.session?.role) && customerServiceTab?.classList.contains("active")) activateTab("#feed-pane");
  if (state.session?.role === "ops" && inboxTab?.classList.contains("active")) activateTab("#validation-pane");
  if (state.session?.role !== "admin" && opsTab?.classList.contains("active")) activateTab("#feed-pane");
  if (!canViewActivity && activityTab?.classList.contains("active")) activateTab("#feed-pane");
  if (!["admin", "ops"].includes(state.session?.role) && validationTab?.classList.contains("active")) activateTab("#feed-pane");
  if (isSupport && !["#feed-pane", "#requests-pane", "#clients-pane", "#providers-pane", "#customer-service-pane", "#inbox-pane", "#activity-pane", "#settings-pane"].includes(state.lastDashboardTabTarget)) activateTab("#feed-pane");
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
  if (target === "#requests-pane") clearVisibleProviderJobNotifications();
}

function rememberDashboardTab(target) {
  if (!target || target === "#activity-pane") return;
  state.lastDashboardTabTarget = target;
}

function fallbackDashboardTab() {
  const lastTab = $(`.app-tabs .nav-link[data-bs-target="${escapeAttribute(state.lastDashboardTabTarget)}"]`);
  if (lastTab && !lastTab.hidden) return state.lastDashboardTabTarget;
  const tab = $$(".app-tabs .nav-link").find((item) => !item.hidden && !["#activity-pane", "#settings-pane"].includes(item.dataset.bsTarget));
  return tab?.dataset.bsTarget || "#feed-pane";
}

function focusRequestCard(requestId, offerId = "") {
  route("app");
  activateTab("#requests-pane");
  clearJobRequestNotification(requestId);
  const focus = (attempt = 0) => {
    const card = $(`[data-request-card="${escapeCssIdentifier(requestId)}"]`);
    if (!card) {
      if (attempt < 5) setTimeout(() => focus(attempt + 1), 120);
      return;
    }
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("request-card-focus");
    setTimeout(() => card.classList.remove("request-card-focus"), 2200);
    if (offerId) {
      const offerCard = card.querySelector(`[data-offer-card="${escapeCssIdentifier(offerId)}"]`);
      offerCard?.classList.add("request-card-focus");
      setTimeout(() => offerCard?.classList.remove("request-card-focus"), 2200);
    }
  };
  requestAnimationFrame(() => focus());
}

function renderActions() {
  const row = $("[data-action-row]");
  if (!row || !state.session) return;
  ensureActiveRole();
  row.dataset.actionLayout = canActAsMarketplace() ? "single-row" : "default";

  const actions = [];
  if (canActAsMarketplace() && ownProviderProfile()) {
    actions.push(`
      <div class="btn-group role-switch" role="group" aria-label="Choose active marketplace role">
        <button class="btn btn-${state.activeRole === "client" ? "primary" : "outline-primary"}" type="button" data-active-role="client"><i class="fa-solid fa-user"></i><span>Client</span></button>
        <button class="btn btn-${state.activeRole === "provider" ? "primary" : "outline-primary"}" type="button" data-active-role="provider"><i class="fa-solid fa-screwdriver-wrench"></i><span>Provider</span></button>
      </div>
    `);
  }
  if (canActAsClient()) {
    actions.push(`<button class="btn btn-primary" type="button" data-new-request><i class="fa-solid fa-plus"></i><span>Post Request</span></button>`);
  }
  if (canActAsMarketplace() && (!ownProviderProfile() || state.activeRole === "provider")) {
    const hasProviderProfile = Boolean(ownProviderProfile());
    actions.push(`<button class="btn ${hasProviderProfile ? "btn-outline-primary" : "btn-provider-setup"}" type="button" data-provider-profile data-provider-setup="${hasProviderProfile ? "false" : "true"}"><i class="fa-solid fa-briefcase"></i><span>${hasProviderProfile ? "Provider Profile" : "Add a Provider Profile"}</span></button>`);
  }
  if (canActAsMarketplace()) {
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
  if (["admin", SUPPORT_ROLE].includes(state.session.role)) {
    actions.push(`<button class="btn btn-outline-secondary" type="button" data-team-note title="Post a short note to the shared Activity feed."><i class="fa-solid fa-note-sticky"></i><span>Team Note</span></button>`);
  }
  row.innerHTML = actions.join("");

  $$("[data-active-role]", row).forEach((button) => button.addEventListener("click", () => setActiveRole(button.dataset.activeRole)));
  $$("[data-new-request]", row).forEach((button) => button.addEventListener("click", openRequestModal));
  $("[data-provider-profile]")?.addEventListener("click", openProviderModal);
  $("[data-admin-create-account]")?.addEventListener("click", openAdminCreateAccountModal);
  $("[data-client-survey]")?.addEventListener("click", openClientSurveyModal);
  $("[data-provider-interview]")?.addEventListener("click", openProviderInterviewModal);
  $("[data-open-support]")?.addEventListener("click", openCustomerServicePlatform);
  $("[data-team-note]")?.addEventListener("click", openMessageModal);
  const activeRoleLabel = state.activeRole ? roleLabel(state.activeRole) : roleLabel(state.session.role);
  $("[data-dashboard-title]").textContent = `${activeRoleLabel} Dashboard`;
  $("[data-role-pill]").textContent = `${activeRoleLabel}${state.activeRole && state.activeRole !== state.session.role ? ` mode · ${roleLabel(state.session.role)} account` : ""}`;
  const firstName = String(state.session.name || state.session.username || "there").trim().split(/\s+/)[0] || "there";
  $("[data-home-greeting]") && ($("[data-home-greeting]").textContent = `Good day, ${firstName}`);
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
  const offer = acceptedOffer(request) || visibleOffers(request)[0];
  return currencyNumber(offer?.amount || request.budget);
}

function acceptedOffer(request = {}) {
  if (!request?.acceptedProviderId) return null;
  return visibleOffers(request).find((item) => item.providerId === request.acceptedProviderId) || null;
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

async function loadFeed(options = {}) {
  if (!state.session || state.feedSyncing || (state.feedLoaded && options.silent && !options.force)) return;
  state.feedSyncing = true;
  try {
    const payload = await apiFetch("/api/feed", { method: "GET", silentError: Boolean(options.silent) });
    state.feedPosts = payload.posts || [];
    state.feedLoaded = true;
    renderFeed();
  } catch (error) {
    if (!options.silent) notify("Feed unavailable", error.message || "Could not load the feed.", "error");
  } finally {
    state.feedSyncing = false;
  }
}

async function loadPublicPost() {
  const params = new URLSearchParams(window.location.search);
  const postId = state.publicPostId || params.get("post") || params.get("feedPost") || "";
  state.publicPostId = postId;
  if (!postId || state.publicPostLoading) return;
  state.publicPostLoading = true;
  try {
    const payload = await apiFetch(`/api/public-post/${encodeURIComponent(postId)}`, { method: "GET", silentError: true });
    state.publicPost = payload.post || null;
  } catch {
    state.publicPost = null;
  } finally {
    state.publicPostLoading = false;
    renderPublicPost();
  }
}

function renderFeed() {
  const list = $("[data-feed-list]");
  const form = $("[data-feed-form]");
  if (!list || !form) return;
  const photo = $("[data-feed-composer-photo]");
  if (photo) {
    photo.src = resolveMediaUrl(state.session?.photoUrl);
    photo.alt = state.session ? `${displayUserName(state.session)} photo` : "";
  }
  const officialWrap = $("[data-feed-official-wrap]");
  if (officialWrap) officialWrap.hidden = !canPostOfficialFeed();
  if (!state.session) {
    list.innerHTML = "";
    return;
  }
  if (state.feedSyncing && !state.feedLoaded) {
    list.innerHTML = `<div class="empty-card"><strong>Loading feed...</strong><p>Fetching community posts.</p></div>`;
    return;
  }
  list.innerHTML = state.feedPosts.length
    ? state.feedPosts.map((post) => renderFeedPost(post)).join("")
    : `<div class="empty-card"><strong>No posts yet</strong><p>Share the first service update or community note.</p></div>`;
  bindFeedPostActions(list);
  applyHomeSearch();
}

function bindFeedAudienceSelector(scope = document) {
  $$("[data-feed-audience]", scope).forEach((audience) => {
    const button = $("[data-feed-audience-button]", audience);
    const menu = $("[data-feed-audience-menu]", audience);
    const input = $("[data-feed-visibility]", audience);
    if (!button || !menu || !input || audience.dataset.bound === "true") return;
    audience.dataset.bound = "true";
    setFeedAudienceValue(input.value || "public", audience);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const opening = menu.hidden;
      closeFeedAudienceMenus();
      menu.hidden = !opening;
      button.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    $$("[data-feed-audience-option]", audience).forEach((option) => {
      option.addEventListener("click", () => {
        setFeedAudienceValue(option.dataset.feedAudienceOption || "public", audience);
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      });
    });
  });
}

function homeSearchText(values = []) {
  return values
    .flat(Infinity)
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

function applyHomeSearch() {
  const input = $("[data-home-search]");
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  const categoryTiles = $$("[data-service-category]");
  const feedItems = $$("[data-feed-list] [data-home-search-item]");
  const jobItems = $$("[data-request-list] [data-home-search-item]");
  const providerItems = $$("[data-provider-list] [data-home-search-item]");
  let matches = 0;
  const apply = (items, getText) => {
    items.forEach((item) => {
      const matched = !query || getText(item).includes(query);
      item.hidden = !matched;
      if (matched) matches += 1;
    });
  };
  apply(categoryTiles, (item) => homeSearchText([item.dataset.serviceCategory, item.textContent]));
  apply(feedItems, (item) => item.dataset.homeSearchText || item.textContent.toLowerCase());
  apply(jobItems, (item) => item.dataset.homeSearchText || item.textContent.toLowerCase());
  apply(providerItems, (item) => item.dataset.homeSearchText || item.textContent.toLowerCase());
  const empty = $("[data-home-search-empty]");
  if (empty) empty.hidden = !query || matches > 0;
}

function setFeedAudienceValue(value = "public", audience = $("[data-feed-audience]")) {
  if (!audience) return;
  const visibility = value === "private" ? "private" : "public";
  const input = $("[data-feed-visibility]", audience);
  const label = $("[data-feed-audience-label]", audience);
  const menu = $("[data-feed-audience-menu]", audience);
  if (input) input.value = visibility;
  if (label) {
    label.innerHTML = visibility === "private"
      ? `<b aria-hidden="true">👥</b> Private`
      : `<b aria-hidden="true">🌐</b> Public`;
  }
  $$("[data-feed-audience-option]", menu || audience).forEach((option) => {
    option.setAttribute("aria-checked", option.dataset.feedAudienceOption === visibility ? "true" : "false");
  });
}

function closeFeedAudienceMenus() {
  $$("[data-feed-audience]").forEach((audience) => {
    const menu = $("[data-feed-audience-menu]", audience);
    const button = $("[data-feed-audience-button]", audience);
    if (menu) menu.hidden = true;
    button?.setAttribute("aria-expanded", "false");
  });
}

function renderPublicPost() {
  const host = $("[data-public-post]");
  if (!host) return;
  if (state.publicPostLoading) {
    host.innerHTML = `<div class="empty-card"><strong>Loading post...</strong><p>Opening this public KAILA post.</p></div>`;
    return;
  }
  host.innerHTML = state.publicPost
    ? renderFeedPost(state.publicPost, { publicOnly: true })
    : `<div class="empty-card"><strong>Post unavailable</strong><p>This shared post is private, deleted, or no longer available.</p><button class="btn btn-primary" type="button" data-route="login">Login</button></div>`;
  bindFeedPostActions(host, { publicOnly: true });
  $$("[data-route]", host).forEach((el) => el.addEventListener("click", () => route(el.dataset.route)));
}

function renderFeedPost(post = {}, options = {}) {
  const publicOnly = Boolean(options.publicOnly);
  const shareUrl = feedShareUrl(post);
  const visibilityIcon = post.visibility === "private" ? "fa-lock" : "fa-globe";
  const canManage = !publicOnly && Boolean(post.canManage);
  return `
    <article class="feed-card ${post.official ? "official" : ""}" data-feed-post="${escapeAttribute(post.id)}" data-home-search-item="feed" data-home-search-text="${escapeAttribute(homeSearchText([post.authorName, post.body, post.visibility, ...(post.comments || []).map((comment) => comment.body)]))}">
      <div class="feed-card-head">
        <img src="${escapeAttribute(resolveMediaUrl(post.authorPhotoUrl))}" alt="${escapeAttribute(post.authorName || "KAILA user")} photo">
        <div>
          <strong>${escapeHtml(post.authorName || "KAILA user")} ${post.official ? `<span class="verified-badge" title="Official KAILA"><i class="fa-solid fa-circle-check"></i></span>` : ""}</strong>
          <span>${escapeHtml(formatDateTime(post.createdAt))} · <i class="fa-solid ${visibilityIcon}"></i> ${escapeHtml(capitalize(post.visibility || "public"))}</span>
        </div>
        ${canManage ? renderFeedPostMoreMenu() : ""}
      </div>
      ${post.body ? `<p class="feed-body">${escapeHtml(post.body)}</p>` : ""}
      ${renderFeedMedia(post.media)}
      <div class="feed-stats">
        <span>${feedReactionTotal(post)} reaction${feedReactionTotal(post) === 1 ? "" : "s"}</span>
        <span>${post.commentCount || 0} comment${post.commentCount === 1 ? "" : "s"}</span>
        ${post.visibility === "public" ? `<span>${post.shareCount || 0} share${post.shareCount === 1 ? "" : "s"}</span>` : ""}
      </div>
      <div class="feed-actions">
        ${["like", "helpful", "interested"].map((reaction) => `
          <button class="${post.viewerReactions?.includes(reaction) ? "active" : ""}" type="button" data-feed-reaction="${reaction}" ${publicOnly ? "data-auth-required" : ""}>
            <i class="fa-solid ${reaction === "like" ? "fa-thumbs-up" : reaction === "helpful" ? "fa-hand-holding-heart" : "fa-star"}"></i>
            <span>${escapeHtml(capitalize(reaction))}</span>
            <b>${Number(post.reactions?.[reaction] || 0)}</b>
          </button>
        `).join("")}
        <button type="button" data-feed-comment-focus ${publicOnly ? "data-auth-required" : ""}><i class="fa-solid fa-comment"></i><span>Comment</span></button>
        ${post.visibility === "public" ? `<button type="button" data-feed-share="${escapeAttribute(shareUrl)}"><i class="fa-solid fa-share-nodes"></i><span>Share</span></button>` : ""}
        ${post.visibility === "public" ? `<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i><span>Facebook</span></a>` : ""}
      </div>
      <div class="feed-comments">
        ${(post.comments || []).slice(-4).map((comment) => renderFeedComment(comment, post, { publicOnly })).join("")}
        <form class="feed-comment-form" data-feed-comment-form ${publicOnly ? "data-auth-required" : ""}>
          <input class="form-control form-control-sm" name="body" maxlength="800" placeholder="Write a comment">
          <button class="btn btn-sm btn-primary" type="submit" aria-label="Send comment"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </article>
  `;
}

function renderFeedComment(comment = {}, post = {}, options = {}) {
  const publicOnly = Boolean(options.publicOnly);
  const isReply = Boolean(options.isReply);
  const stateClass = comment.deleted ? "deleted" : comment.hidden ? "hidden" : "";
  return `
    <div class="feed-comment-wrap ${stateClass}" data-feed-comment-wrap data-feed-comment="${escapeAttribute(comment.id)}">
      <div class="feed-comment">
        <img src="${escapeAttribute(resolveMediaUrl(comment.authorPhotoUrl))}" alt="">
        <div>
          <strong>${escapeHtml(comment.authorName || "KAILA user")} ${comment.official ? `<span class="verified-badge"><i class="fa-solid fa-circle-check"></i></span>` : ""}</strong>
          <p>${escapeHtml(comment.body)}</p>
          <div class="feed-comment-actions">
            ${renderFeedCommentReactionButtons(comment, publicOnly)}
            ${isReply || comment.hidden || comment.deleted ? "" : `<button type="button" data-feed-reply-toggle title="Reply" aria-label="Reply" ${publicOnly ? "data-auth-required" : ""}><span aria-hidden="true">💬</span></button>`}
            ${renderFeedCommentMoreMenu(comment)}
          </div>
        </div>
      </div>
      ${isReply ? "" : `<form class="feed-comment-form feed-reply-form" data-feed-reply-form hidden ${publicOnly ? "data-auth-required" : ""}>
        <input class="form-control form-control-sm" name="body" maxlength="800" placeholder="Write a reply">
        <button class="btn btn-sm btn-primary" type="submit" aria-label="Send reply"><i class="fa-solid fa-paper-plane"></i></button>
      </form>`}
      ${(comment.replies || []).length ? `<div class="feed-replies">${comment.replies.map((reply) => renderFeedComment(reply, post, { publicOnly, isReply: true })).join("")}</div>` : ""}
    </div>
  `;
}

function renderFeedCommentReactionButtons(comment = {}, publicOnly = false) {
  if (comment.hidden || comment.deleted) return "";
  const labels = { like: "Like", helpful: "Helpful", interested: "Interested" };
  const icons = { like: "👍", helpful: "🙌", interested: "⭐" };
  return ["like", "helpful", "interested"].map((reaction) => `
    <button class="${comment.viewerReactions?.includes(reaction) ? "active" : ""}" type="button" data-feed-comment-reaction="${reaction}" title="${escapeAttribute(labels[reaction])}" aria-label="${escapeAttribute(labels[reaction])}" ${publicOnly ? "data-auth-required" : ""}>
      <span aria-hidden="true">${escapeHtml(icons[reaction])}</span>
      <b>${Number(comment.reactions?.[reaction] || 0)}</b>
    </button>
  `).join("");
}

function renderFeedCommentMoreMenu(comment = {}) {
  if (!comment.canModerate || comment.deleted) return "";
  const actions = [
    comment.hidden && !comment.deleted ? `<button type="button" data-feed-comment-moderate="unhide" role="menuitem">Unhide</button>` : "",
    !comment.hidden && !comment.deleted ? `<button type="button" data-feed-comment-moderate="hide" role="menuitem">Hide</button>` : "",
    !comment.deleted ? `<button type="button" data-feed-comment-moderate="delete" role="menuitem">Delete</button>` : "",
  ].filter(Boolean).join("");
  if (!actions) return "";
  return `
    <span class="feed-comment-more">
      <button type="button" data-feed-comment-more title="More actions" aria-label="More actions" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">⋮</span></button>
      <span class="feed-comment-more-menu" data-feed-comment-more-menu role="menu" hidden>${actions}</span>
    </span>
  `;
}

function renderFeedMedia(media = []) {
  if (!media.length) return "";
  const item = media[0];
  const url = resolveMediaUrl(item.url);
  return item.mimeType?.startsWith("video/")
    ? `<video class="feed-media" src="${escapeAttribute(url)}" controls playsinline preload="metadata"></video>`
    : `<img class="feed-media" src="${escapeAttribute(url)}" alt="${escapeAttribute(item.originalName || "Feed media")}">`;
}

function bindFeedPostActions(scope, options = {}) {
  $$("[data-auth-required]", scope).forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      promptFeedAuth();
    });
  });
  $$("[data-feed-reaction]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => toggleFeedReaction(button.closest("[data-feed-post]")?.dataset.feedPost, button.dataset.feedReaction));
  });
  $$("[data-feed-comment-form]", scope).forEach((form) => {
    if (options.publicOnly) return;
    form.addEventListener("submit", submitFeedComment);
  });
  $$("[data-feed-reply-form]", scope).forEach((form) => {
    if (options.publicOnly) return;
    form.addEventListener("submit", submitFeedReply);
  });
  $$("[data-feed-comment-focus]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => button.closest("[data-feed-post]")?.querySelector("[data-feed-comment-form] input")?.focus());
  });
  $$("[data-feed-reply-toggle]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => {
      const form = button.closest("[data-feed-comment-wrap]")?.querySelector("[data-feed-reply-form]");
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) form.elements.body?.focus();
    });
  });
  $$("[data-feed-comment-reaction]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => toggleFeedCommentReaction(
      button.closest("[data-feed-post]")?.dataset.feedPost,
      button.closest("[data-feed-comment-wrap]")?.dataset.feedComment,
      button.dataset.feedCommentReaction
    ));
  });
  $$("[data-feed-comment-more]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = button.closest(".feed-comment-more")?.querySelector("[data-feed-comment-more-menu]");
      const opening = button.getAttribute("aria-expanded") !== "true";
      closeFeedCommentMoreMenus();
      if (!menu) return;
      if (opening) openFeedCommentMoreMenu(button, menu);
    });
  });
  $$("[data-feed-comment-moderate]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => moderateFeedComment(
      button.closest("[data-feed-post]")?.dataset.feedPost,
      button.closest("[data-feed-comment-wrap]")?.dataset.feedComment,
      button.dataset.feedCommentModerate
    ));
  });
  $$("[data-feed-share]", scope).forEach((button) => {
    button.addEventListener("click", () => shareFeedPost(button.closest("[data-feed-post]")?.dataset.feedPost, button.dataset.feedShare));
  });
  $$("[data-feed-post-more]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = button.closest(".feed-post-more")?.querySelector("[data-feed-post-more-menu]");
      const opening = button.getAttribute("aria-expanded") !== "true";
      closeFeedPostMoreMenus();
      if (!menu || !opening) return;
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
    });
  });
  $$("[data-feed-post-action]", scope).forEach((button) => {
    if (options.publicOnly) return;
    button.addEventListener("click", () => {
      const postId = button.closest("[data-feed-post]")?.dataset.feedPost;
      closeFeedPostMoreMenus();
      if (button.dataset.feedPostAction === "edit") editFeedPost(postId);
      if (button.dataset.feedPostAction === "delete") deleteFeedPost(postId);
    });
  });
}

function renderFeedPostMoreMenu() {
  return `
    <span class="feed-post-more">
      <button type="button" data-feed-post-more title="Post options" aria-label="Post options" aria-haspopup="menu" aria-expanded="false">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>
      <span class="feed-post-more-menu" data-feed-post-more-menu role="menu" hidden>
        <button type="button" data-feed-post-action="edit" role="menuitem"><i class="fa-solid fa-pen"></i><span>Edit post</span></button>
        <button type="button" data-feed-post-action="delete" role="menuitem"><i class="fa-solid fa-trash"></i><span>Delete post</span></button>
      </span>
    </span>
  `;
}

function closeFeedPostMoreMenus() {
  $$("[data-feed-post-more-menu]").forEach((menu) => {
    menu.hidden = true;
  });
  $$("[data-feed-post-more]").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function closeFeedCommentMoreMenus() {
  $$("[data-feed-comment-more-menu]").forEach((menu) => {
    menu.hidden = true;
  });
  const floatingMenu = $("[data-feed-comment-floating-menu]");
  if (floatingMenu) {
    floatingMenu.hidden = true;
    floatingMenu.innerHTML = "";
  }
  $$("[data-feed-comment-more]").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function feedCommentFloatingMenu() {
  let menu = $("[data-feed-comment-floating-menu]");
  if (menu) return menu;
  menu = document.createElement("div");
  menu.className = "feed-comment-more-menu feed-comment-floating-menu";
  menu.dataset.feedCommentFloatingMenu = "";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  document.body.appendChild(menu);
  return menu;
}

function openFeedCommentMoreMenu(button, sourceMenu) {
  const postId = button.closest("[data-feed-post]")?.dataset.feedPost;
  const commentId = button.closest("[data-feed-comment-wrap]")?.dataset.feedComment;
  const menu = feedCommentFloatingMenu();
  menu.innerHTML = sourceMenu.innerHTML;
  menu.hidden = false;
  menu.style.visibility = "hidden";
  $$("[data-feed-comment-moderate]", menu).forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = item.dataset.feedCommentModerate;
      closeFeedCommentMoreMenus();
      moderateFeedComment(postId, commentId, action);
    });
  });
  positionFeedCommentMoreMenu(button, menu);
  sourceMenu.hidden = true;
  button.setAttribute("aria-expanded", "true");
}

function positionFeedCommentMoreMenu(button, menu) {
  const margin = 8;
  const rect = button.getBoundingClientRect();
  const size = menu.getBoundingClientRect();
  const width = Math.min(size.width || 128, window.innerWidth - (margin * 2));
  const height = Math.min(size.height || 88, window.innerHeight - (margin * 2));
  let left = rect.right - width;
  let top = rect.bottom + 6;
  if (left < margin) left = rect.left;
  left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
  if (top + height > window.innerHeight - margin) top = rect.top - height - 6;
  top = Math.min(Math.max(margin, top), window.innerHeight - height - margin);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.maxWidth = `${window.innerWidth - (margin * 2)}px`;
  menu.style.visibility = "visible";
}

async function createFeedPost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.posting === "true") return;
  setFeedComposerPosting(form, true);
  const body = form.elements.body?.value.trim() || "";
  let attachments;
  try {
    attachments = await readMediaAttachments("[data-feed-media]", form);
  } catch (error) {
    setFeedComposerPosting(form, false);
    notify("Media failed", error.message || "Could not read the selected file.", "error");
    return;
  }
  if (!attachments) {
    setFeedComposerPosting(form, false);
    return;
  }
  if (!body && !attachments.length) {
    setFeedComposerPosting(form, false);
    notify("Post is empty", "Write something or add a photo/video.", "warning");
    return;
  }
  const payload = {
    body,
    visibility: form.elements.visibility?.value || "public",
    postAsOfficial: Boolean(form.elements.postAsOfficial?.checked),
    attachments,
  };
  try {
    const result = await apiFetch("/api/feed", { method: "POST", body: JSON.stringify(payload) });
    state.feedPosts = result.posts || state.feedPosts;
    state.feedLoaded = true;
    resetFeedComposer(form);
    renderFeed();
    notify("Posted", payload.visibility === "public" ? "Your post is live in the feed." : "Your private post is saved.", "success");
  } catch (error) {
    const message = error.status === 404
      ? "Feed API route not found on the running backend. Restart the KAILA socket service so it loads /api/feed."
      : (error.message || "Could not create post.");
    notify("Post failed", message, "error");
    if (error.status === 404) console.error("KAILA feed create route missing on active API server", { apiBase: apiBase(), path: "/api/feed" });
  } finally {
    setFeedComposerPosting(form, false);
  }
}

function setFeedComposerPosting(form = $("[data-feed-form]"), posting = false) {
  if (!form) return;
  const submitButton = form.querySelector("button[type='submit']");
  form.dataset.posting = posting ? "true" : "false";
  if (!submitButton) return;
  if (posting) {
    submitButton.disabled = true;
    submitButton.dataset.originalHtml = submitButton.dataset.originalHtml || submitButton.innerHTML;
    submitButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Posting`;
    return;
  }
  submitButton.disabled = false;
  submitButton.innerHTML = submitButton.dataset.originalHtml || `<i class="fa-solid fa-paper-plane"></i> Post`;
  delete submitButton.dataset.originalHtml;
}

function resetFeedComposer(form = $("[data-feed-form]")) {
  if (!form) return;
  const body = form.elements.body;
  const media = $("[data-feed-media]", form);
  const preview = $("[data-feed-media-preview]", form);
  if (body) body.value = "";
  if (media) media.value = "";
  if (preview) preview.innerHTML = "";
  if (form.elements.postAsOfficial) form.elements.postAsOfficial.checked = false;
  setFeedAudienceValue("public", $("[data-feed-audience]", form));
  closeFeedAudienceMenus();
}

async function toggleFeedReaction(postId, reaction) {
  if (!postId || !state.session) return promptFeedAuth();
  try {
    const result = await apiFetch(`/api/feed/${encodeURIComponent(postId)}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    });
    state.feedPosts = result.posts || state.feedPosts;
    renderFeed();
  } catch (error) {
    notify("Reaction failed", feedActionErrorMessage(error, "post reaction"), "error");
  }
}

async function submitFeedComment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const postId = form.closest("[data-feed-post]")?.dataset.feedPost;
  const body = form.elements.body?.value.trim() || "";
  if (!postId || !body) return;
  try {
    const result = await apiFetch(`/api/feed/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    state.feedPosts = result.posts || state.feedPosts;
    renderFeed();
  } catch (error) {
    notify("Comment failed", error.message || "Try again.", "error");
  }
}

async function submitFeedReply(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const postId = form.closest("[data-feed-post]")?.dataset.feedPost;
  const commentId = form.closest("[data-feed-comment-wrap]")?.dataset.feedComment;
  const body = form.elements.body?.value.trim() || "";
  if (!postId || !commentId || !body) return;
  try {
    const result = await apiFetch(`/api/feed/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    state.feedPosts = result.posts || state.feedPosts;
    renderFeed();
  } catch (error) {
    notify("Reply failed", feedActionErrorMessage(error, "reply"), "error");
  }
}

async function toggleFeedCommentReaction(postId, commentId, reaction) {
  if (!postId || !commentId || !state.session) return promptFeedAuth();
  try {
    const result = await apiFetch(`/api/feed/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    });
    state.feedPosts = result.posts || state.feedPosts;
    renderFeed();
  } catch (error) {
    notify("Reaction failed", feedActionErrorMessage(error, "comment reaction"), "error");
  }
}

function feedActionErrorMessage(error, actionLabel = "feed action") {
  if (error?.status === 404) return error.message || `The ${actionLabel} route or item was not found. Restart the KAILA socket service if this just changed.`;
  return error?.message || "Try again.";
}

async function moderateFeedComment(postId, commentId, action) {
  if (!postId || !commentId || !["hide", "unhide", "delete"].includes(action)) return;
  const copy = {
    hide: {
      icon: "question",
      title: "Hide comment?",
      text: "The comment will be hidden from normal feed view.",
      confirm: "Hide",
      done: "Comment hidden",
    },
    unhide: {
      icon: "question",
      title: "Unhide comment?",
      text: "The comment will appear normally in the feed again.",
      confirm: "Unhide",
      done: "Comment unhidden",
    },
    delete: {
      icon: "warning",
      title: "Delete comment?",
      text: "The comment will be removed from normal feed view.",
      confirm: "Delete",
      done: "Comment deleted",
    },
  }[action];
  const result = await modal({
    icon: copy.icon,
    title: copy.title,
    text: copy.text,
    confirmButtonText: copy.confirm,
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch(`/api/feed/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/moderation`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    state.feedPosts = response.posts || state.feedPosts;
    renderFeed();
    notify(copy.done, "Feed moderation updated.", "success");
  } catch (error) {
    notify("Moderation failed", error.message || "Try again.", "error");
  }
}

async function editFeedPost(postId) {
  const post = state.feedPosts.find((item) => item.id === postId);
  if (!post?.id) return;
  const result = await modal({
    icon: "question",
    title: "Edit post",
    html: `
      <div class="swal-form">
        <label class="wide">Post
          <textarea class="form-control" data-edit-feed-body rows="5" maxlength="2000">${escapeHtml(post.body || "")}</textarea>
        </label>
        <label>Visibility
          <select class="form-select" data-edit-feed-visibility>
            <option value="public" ${post.visibility === "private" ? "" : "selected"}>Public</option>
            <option value="private" ${post.visibility === "private" ? "selected" : ""}>Private</option>
          </select>
        </label>
      </div>
    `,
    confirmButtonText: "Save",
    preConfirm: () => {
      const popup = window.Swal.getPopup();
      const body = $("[data-edit-feed-body]", popup)?.value.trim() || "";
      const visibility = $("[data-edit-feed-visibility]", popup)?.value || "public";
      if (!body && !(post.media || []).length) {
        window.Swal.showValidationMessage("Write something or keep a photo/video on the post.");
        return false;
      }
      return { body, visibility };
    },
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch(`/api/feed/${encodeURIComponent(post.id)}`, {
      method: "PUT",
      body: JSON.stringify(result.value),
    });
    state.feedPosts = response.posts || state.feedPosts;
    renderFeed();
    notify("Post updated", "Your feed post was saved.", "success");
  } catch (error) {
    notify("Edit failed", feedActionErrorMessage(error, "post edit"), "error");
  }
}

async function deleteFeedPost(postId) {
  const post = state.feedPosts.find((item) => item.id === postId);
  if (!post?.id) return;
  const result = await modal({
    icon: "warning",
    title: "Delete post?",
    text: "This removes the post, reactions, comments, and attached media from the feed.",
    confirmButtonText: "Delete",
    confirmButtonColor: "#dc3545",
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch(`/api/feed/${encodeURIComponent(post.id)}`, { method: "DELETE" });
    state.feedPosts = response.posts || state.feedPosts.filter((item) => item.id !== post.id);
    renderFeed();
    notify("Post deleted", "The feed post was removed.", "success");
  } catch (error) {
    notify("Delete failed", feedActionErrorMessage(error, "post delete"), "error");
  }
}

async function shareFeedPost(postId, url) {
  if (!url) return;
  const post = state.feedPosts.find((item) => item.id === postId) || state.publicPost || {};
  const shareData = { title: "KAILA Service Feed", text: post.body || "Public KAILA service post", url };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard?.writeText?.(url);
      notify("Link copied", "Public post link copied to clipboard.", "success");
    }
    if (postId) {
      await apiFetch(`/api/feed/${encodeURIComponent(postId)}/share`, { method: "POST", body: JSON.stringify({}) });
      loadFeed({ silent: true, force: true }).catch(() => {});
    }
  } catch (error) {
    if (error.name !== "AbortError") notify("Share failed", "Copy the Facebook link or try again.", "warning");
  }
}

function feedReactionTotal(post = {}) {
  return Object.values(post.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function feedShareUrl(post = {}) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("route", "public-post");
  url.searchParams.set("post", post.id || "");
  return url.toString();
}

function canPostOfficialFeed() {
  return ["admin", "ops", SUPPORT_ROLE].includes(state.session?.role);
}

function promptFeedAuth() {
  modal({
    icon: "info",
    title: "Join KAILA",
    text: "Login or create an account to react, comment, post, message, or request service.",
    confirmButtonText: "Login",
    showCancelButton: true,
    cancelButtonText: "Create Account",
  }).then((result) => {
    if (result.isConfirmed) route("login");
    else if (result.dismiss === window.Swal.DismissReason.cancel) route("register");
  });
}

function renderRequests() {
  const host = $("[data-request-list]");
  if (!host) return;
  if (state.session?.role === "ops") {
    host.innerHTML = "";
    return;
  }
  let visible = state.session?.role === "admin" || state.session?.role === SUPPORT_ROLE
    ? state.requests
    : canActAsProvider()
      ? state.requests.filter(isVisibleToProvider)
      : state.requests.filter((request) => request.clientId === state.session?.id);
  const adminPanel = state.session?.role === "admin" ? adminRequestMetricPanel() : "";
  if (state.session?.role === "admin") visible = adminMetricRequests(visible);
  const jobsHeader = renderJobsHeader(visible);
  visible = filterJobRequests(visible, state.jobFilter);

  if (!visible.length) {
    host.innerHTML = `${jobsHeader}${adminPanel}${emptyCard("No matching jobs", "Try a different job filter or post a new request.")}`;
    bindJobsHeaderActions(host);
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

  host.innerHTML = `${jobsHeader}${adminPanel}${requestCards || emptyCard("No active requests", "Cancelled requests are tucked below.")}${cancelledSection}`;

  bindJobsHeaderActions(host);
  bindRequestCardActions(host);
  hydrateRequestRouteDistances(host);
  hydrateOfferRouteDistances(host);
  applyHomeSearch();
}

function filterJobRequests(requests = [], filter = "all") {
  if (filter === "posted") return requests.filter((request) => ["Posted", "Open"].includes(request.status));
  if (filter === "offers") return requests.filter((request) => ["Offers Received", "Countered"].includes(request.status) || visibleOffers(request).length);
  if (filter === "active") return requests.filter((request) => ["Accepted", "In Progress", "Provider Marked Done", "Revision Requested", "Disputed"].includes(request.status));
  if (filter === "completed") return requests.filter((request) => ["Payment Released", "Rated", "Rated / Closed", "Resolved"].includes(request.status));
  return requests;
}

function renderJobsHeader(requests = []) {
  const filters = [
    ["all", "All"],
    ["posted", "Posted"],
    ["offers", "Offers"],
    ["active", "In Progress"],
    ["completed", "Completed"],
  ];
  const counts = Object.fromEntries(filters.map(([key]) => [key, filterJobRequests(requests, key).length]));
  const activeFilter = filters.some(([key]) => key === state.jobFilter) ? state.jobFilter : "all";
  if (activeFilter !== state.jobFilter) state.jobFilter = activeFilter;
  return `
    <section class="jobs-toolbar" aria-label="Jobs">
      <div class="jobs-toolbar-head">
        <div>
          <span>Workspace</span>
          <h2>My Jobs</h2>
        </div>
        <button class="jobs-search-button" type="button" data-home-tab="#feed-pane" aria-label="Search services">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <div class="jobs-filter-tabs" role="tablist" aria-label="Filter jobs">
        ${filters.map(([key, label]) => `
          <button type="button" class="${key === activeFilter ? "active" : ""}" data-job-filter="${key}" role="tab" aria-selected="${key === activeFilter ? "true" : "false"}">
            <span>${escapeHtml(label)}</span>
            <b>${counts[key] || 0}</b>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function bindJobsHeaderActions(host = document) {
  $$("[data-job-filter]", host).forEach((button) => button.addEventListener("click", () => {
    state.jobFilter = button.dataset.jobFilter || "all";
    renderRequests();
  }));
  $$("[data-home-tab]", host).forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.homeTab)));
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

function jobStatusStep(status = "") {
  if (["Offers Received", "Countered"].includes(status)) return 1;
  if (["Accepted", "Revision Requested"].includes(status)) return 2;
  if (["In Progress", "Provider Marked Done", "Disputed"].includes(status)) return 3;
  if (["Payment Released", "Rated", "Rated / Closed", "Resolved"].includes(status)) return 4;
  return 0;
}

function renderJobStatusTracker(request = {}) {
  const activeStep = jobStatusStep(request.status);
  const steps = ["Posted", "Offers Received", "Provider Selected", "In Progress", "Completed"];
  return `
    <div class="job-status-tracker" aria-label="Job status tracker">
      ${steps.map((label, index) => `
        <span class="${index < activeStep ? "done" : index === activeStep ? "active" : ""}">
          <b>${index + 1}</b>
          <em>${escapeHtml(label)}</em>
        </span>
      `).join("")}
    </div>
  `;
}

function requestLastUpdate(request = {}) {
  const values = [
    request.updatedAt,
    request.paymentReleasedAt,
    request.clientRatedAt,
    request.providerRatedAt,
    request.autoConfirmAt,
    request.createdAt,
  ].filter(Boolean);
  return values[0] || "";
}

function renderJobSummary(request = {}) {
  const offers = visibleOffers(request);
  return `
    <div class="job-summary-row">
      <span><i class="fa-solid fa-location-dot"></i>${escapeHtml(request.area || "Pinned job site")}</span>
      <span><i class="fa-solid fa-handshake-angle"></i>${offers.length} offer${offers.length === 1 ? "" : "s"}</span>
      <span><i class="fa-solid fa-wallet"></i>${escapeHtml(formatCurrency(request.budget))}</span>
      <span><i class="fa-solid fa-clock"></i>${escapeHtml(formatRelativeTime(requestLastUpdate(request)) || "recent")}</span>
    </div>
  `;
}

function renderJobPrimaryCta(request = {}) {
  if (canSelectOffer(request)) return `<button class="btn btn-sm btn-primary" type="button" data-open-offers-screen="${escapeAttribute(request.id)}"><i class="fa-solid fa-list-check"></i> View Offers</button>`;
  if (request.status === "Provider Marked Done" && request.clientId === state.session?.id) return `<button class="btn btn-sm btn-primary" type="button" data-open-completed-screen="${escapeAttribute(request.id)}"><i class="fa-solid fa-shield-halved"></i> Review Completion</button>`;
  if (request.clientId === state.session?.id && request.status === "Payment Released" && !request.clientRatedAt) return `<button class="btn btn-sm btn-primary" type="button" data-open-completed-screen="${escapeAttribute(request.id)}"><i class="fa-solid fa-star"></i> Rate Job</button>`;
  if (request.acceptedProviderId === state.session?.id && request.status === "Payment Released" && !request.providerRatedAt) return `<button class="btn btn-sm btn-primary" type="button" data-open-completed-screen="${escapeAttribute(request.id)}"><i class="fa-solid fa-star"></i> Rate Job</button>`;
  if (navigationTargetForRequest(request) || ["Accepted", "In Progress", "Revision Requested"].includes(request.status)) return `<button class="btn btn-sm btn-primary" type="button" data-open-active-job="${escapeAttribute(request.id)}"><i class="fa-solid fa-route"></i> Track Job</button>`;
  if (canViewConversation(request)) return `<button class="btn btn-sm btn-primary" type="button" data-conversation="${escapeAttribute(request.id)}"><i class="fa-solid fa-message"></i> Message</button>`;
  return "";
}

function renderRequestCard(request) {
  return `
    <article class="k-card request-card" data-request-card="${escapeAttribute(request.id)}" data-home-search-item="job" data-home-search-text="${escapeAttribute(homeSearchText([request.title, request.category, request.details, request.description, request.status, request.area, request.urgency, request.preferredSchedule]))}">
      <div class="request-card-head">
        <div class="request-title-block">
          <span class="request-kicker">${escapeHtml(request.urgency || "Request")}</span>
          <h3>${escapeHtml(request.category)}</h3>
          <p>${escapeHtml(request.details)}</p>
        </div>
        <span class="badge text-bg-${statusColor(request.status)} status-pill align-self-start">${escapeHtml(request.status)}</span>
      </div>
      ${renderJobSummary(request)}
      ${renderJobStatusTracker(request)}
      ${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation)}
      <div class="meta">
        <span>${escapeHtml(request.area)}</span>
        <span>${escapeHtml(request.urgency)}</span>
        ${request.preferredSchedule ? `<span>${escapeHtml(request.preferredSchedule)}</span>` : ""}
        <span>${escapeHtml(formatCurrency(request.budget))}</span>
        ${renderRequestDistanceMeta(request)}
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
      ${renderNavigationCard(request)}
      ${renderOffers(request)}
      ${renderAttachments("Request media", request.requestAttachments, request.id)}
      ${renderCompletionPanel(request)}
      ${renderRatings(request)}
      ${request.disputeNote ? `<div class="offer"><strong>Dispute note</strong><div>${escapeHtml(request.disputeNote)}</div></div>` : ""}
      ${renderAttachments("Dispute media", request.disputeAttachments, request.id)}
      ${renderJobPrimaryCta(request) ? `<div class="job-primary-cta">${renderJobPrimaryCta(request)}</div>` : ""}
      <div class="card-actions">
        ${canEditRequest(request) ? `<button class="btn btn-sm btn-outline-primary" data-edit-request="${request.id}"><i class="fa-solid fa-pen"></i> Edit</button>` : ""}
        ${canAcceptClientPrice(request) ? `<button class="btn btn-sm btn-outline-success" data-accept-client-price="${request.id}"><i class="fa-solid fa-circle-check"></i> Accept Price</button>` : ""}
        ${canUpdateRequestDistance(request) ? `<button class="btn btn-sm btn-outline-secondary" data-update-request-distance="${request.id}"><i class="fa-solid fa-location-crosshairs"></i> Distance</button>` : ""}
        ${canSelectOffer(request) ? `<button class="btn btn-sm btn-outline-primary" data-open-offers-screen="${request.id}"><i class="fa-solid fa-list-check"></i> Offers</button>` : ""}
        ${navigationTargetForRequest(request) ? `<button class="btn btn-sm btn-outline-primary" data-open-active-job="${request.id}"><i class="fa-solid fa-diamond-turn-right"></i> Track</button>` : ""}
        ${canOffer(request) ? `<button class="btn btn-sm btn-outline-primary" data-offer="${request.id}"><i class="fa-solid fa-hand-holding-dollar"></i> Offer</button>` : ""}
        ${canPass(request) ? `<button class="btn btn-sm btn-outline-secondary" data-pass="${request.id}"><i class="fa-solid fa-forward-step"></i> Pass</button>` : ""}
        ${canViewConversation(request) ? `<button class="btn btn-sm btn-outline-primary" data-conversation="${request.id}"><i class="fa-solid fa-message"></i> Messages</button>` : ""}
        ${jobActionButtons(request)}
        ${canReportJob(request) ? `<button class="btn btn-sm btn-outline-warning" data-report-job="${request.id}"><i class="fa-solid fa-flag"></i> Report Job</button>` : ""}
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

function renderRequestDistanceMeta(request) {
  if (canActAsProvider() && request.clientId !== state.session?.id) {
    const origin = providerRouteOriginForRequest(request);
    const distance = origin && request.jobLocation ? cachedRouteDistanceKm(origin, request.jobLocation) : null;
    if (distance !== null) return `<span data-request-route-distance="${escapeAttribute(request.id)}"><i class="fa-solid fa-location-dot"></i> Job site pinned · Route ${escapeHtml(formatDistanceKm(distance))} from you</span>`;
    if (origin && request.jobLocation) return `<span data-request-route-distance="${escapeAttribute(request.id)}"><i class="fa-solid fa-location-dot"></i> Job site pinned · Calculating route distance from you...</span>`;
    if (request.jobLocation) return `<span data-request-route-distance="${escapeAttribute(request.id)}"><i class="fa-solid fa-location-dot"></i> Job site pinned · Allow GPS for route distance</span>`;
  }
  if (request.clientId === state.session?.id && request.jobLocation) {
    return `<span><i class="fa-solid fa-location-dot"></i> Job site pinned</span>`;
  }
  return "";
}

function canUpdateRequestDistance(request = {}) {
  return Boolean(canActAsProvider() && request.clientId !== state.session?.id && request.jobLocation && !providerRouteOriginForRequest(request));
}

function navigationTargetForRequest(request = {}) {
  if (!state.session || !request?.id) return null;
  if (!canNavigateRequest(request)) return null;
  const destination = normalizeLocation(request.jobLocation);
  if (!destination) return null;
  if (request.acceptedProviderId === state.session.id) {
    return {
      destination,
      label: "Job site",
      detail: request.exactLocationNotes || request.area || "",
      mode: "provider",
    };
  }
  if (request.clientId === state.session.id) {
    return {
      destination,
      label: userProfile(request.acceptedProviderId).name || "Provider",
      detail: request.exactLocationNotes || request.area || "",
      mode: "customer",
    };
  }
  if (["admin", SUPPORT_ROLE].includes(state.session.role) && request.navigationState) return {
    destination,
    label: "Live job tracking",
    detail: request.area || "",
    mode: "viewer",
  };
  return null;
}

function canNavigateRequest(request = {}) {
  return ["Accepted", "In Progress", "Revision Requested"].includes(request.status);
}

function syncNavigationSessionAvailability() {
  const requestId = state.navigationSession?.request?.id;
  if (!requestId) return;
  const request = state.requests.find((item) => item.id === requestId);
  if (request && navigationTargetForRequest(request)) {
    state.navigationSession.request = request;
    return;
  }
  stopNavigationWatch({ clearSession: true });
}

function navigationStatusText(nav = {}) {
  const status = nav.arrivalState || nav.status || "waiting";
  if (status === "arrived") return "Provider arrived";
  if (status === "nearby") return "Provider nearby";
  if (status === "on_the_way") return "On the way";
  if (status === "paused") return "Tracking paused";
  if (status === "stopped") return "Tracking stopped";
  if (status === "requesting_permission") return "Checking GPS permission";
  if (status === "waiting_gps_permission") return "Waiting for GPS permission";
  if (status === "waiting_gps_signal") return "Waiting for GPS signal";
  if (status === "starting") return "Starting travel";
  if (status === "failed") return "Travel needs attention";
  return "Waiting to start travel";
}

function navigationStatusClass(nav = {}) {
  const status = nav.arrivalState || nav.status || "waiting";
  if (status === "arrived") return "arrived";
  if (status === "nearby") return "nearby";
  if (status === "on_the_way") return "on-way";
  if (status === "stopped" || status === "paused") return "paused";
  if (status === "requesting_permission" || status === "waiting_gps_permission" || status === "waiting_gps_signal" || status === "starting") return "starting";
  if (status === "failed") return "failed";
  return "waiting";
}

function isNavigationActive(nav = {}) {
  const status = nav.arrivalState || nav.status || "";
  return ["on_the_way", "nearby", "arrived"].includes(status) || Boolean(nav.startedAt && status !== "stopped" && status !== "paused");
}

function navigationPhase(session = {}) {
  if (session.localNavigationPhase) return session.localNavigationPhase;
  const nav = session.navigationState || {};
  if (isNavigationActive(nav)) return "active";
  if (nav.status === "stopped" || nav.arrivalState === "stopped") return "stopped";
  if (nav.status === "paused" || nav.arrivalState === "paused") return "paused";
  return "idle";
}

function navigationDisplayState(session = {}) {
  const nav = session.navigationState || {};
  const phase = navigationPhase(session);
  if (phase === "requesting_permission") return { ...nav, status: "requesting_permission", arrivalState: "requesting_permission" };
  if (phase === "waiting_gps_permission") return { ...nav, status: "waiting_gps_permission", arrivalState: "waiting_gps_permission" };
  if (phase === "waiting_gps_signal") return { ...nav, status: "waiting_gps_signal", arrivalState: "waiting_gps_signal" };
  if (phase === "starting" || phase === "waiting_to_start") return { ...nav, status: "starting", arrivalState: "starting" };
  if (phase === "failed") return { ...nav, status: "failed", arrivalState: "failed" };
  return nav;
}

function navigationUpdatedText(session = {}, route = null) {
  const nav = session.navigationState || {};
  const timestamp = nav.lastLocationAt || nav.updatedAt || nav.startedAt || "";
  if (timestamp && isNavigationActive(nav)) {
    const stale = nav.lastLocationAt && Date.now() - new Date(nav.lastLocationAt).getTime() > NAVIGATION_STALE_MS;
    return `${stale ? "Stale update" : "Last updated"} ${formatRelativeTime(timestamp)}`;
  }
  if (navigationPhase(session) === "requesting_permission") return "Requesting GPS permission";
  if (navigationPhase(session) === "waiting_gps_permission") return "Route ready - waiting for GPS permission";
  if (navigationPhase(session) === "waiting_gps_signal") return "Route ready - waiting for GPS signal";
  if (navigationPhase(session) === "starting" || navigationPhase(session) === "waiting_to_start") return "Confirming travel start";
  if (route) return "Route ready - waiting for live GPS";
  if (session.providerLocation || nav.providerLocation) return "Route ready - waiting for live GPS";
  return "No live update yet";
}

function formatNavigationDistance(nav = {}) {
  const meters = Number(nav.distanceMeters);
  if (!Number.isFinite(meters)) return "";
  return formatDistanceKm(meters / 1000);
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return formatDateTime(value);
}

function renderNavigationCard(request = {}) {
  const target = navigationTargetForRequest(request);
  if (!target) return "";
  const nav = request.navigationState || {};
  const status = navigationStatusText(nav);
  const providerLine = nav.providerLocation
    ? `${formatNavigationDistance(nav)}${nav.etaMinutes ? ` · ${nav.etaMinutes} min ETA` : ""}`
    : target.mode === "provider" ? "Ready to share live travel." : "Waiting for provider to start travel.";
  return `
    <div class="offer navigation-card">
      <strong><i class="fa-solid fa-route"></i> ${escapeHtml(status)}</strong>
      <div>${escapeHtml(providerLine)}</div>
      ${nav.lastLocationAt ? `<small>Last updated ${escapeHtml(formatRelativeTime(nav.lastLocationAt))}</small>` : ""}
    </div>
  `;
}

function renderAcceptedProviderContact(request) {
  const isClientOwner = request.clientId === state.session?.id;
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
  const isAcceptedProvider = request.acceptedProviderId === state.session?.id;
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

function renderCompletionPanel(request = {}) {
  const hasCompletion = Boolean(request.proofNote || request.completionAttachments?.length || ["Provider Marked Done", "Payment Released", "Rated", "Rated / Closed", "Resolved", "Revision Requested"].includes(request.status));
  if (!hasCompletion) return "";
  const firstMedia = request.completionAttachments?.[0];
  const mediaUrl = firstMedia ? resolveMediaUrl(firstMedia.url) : "";
  const isVideo = firstMedia?.mimeType?.startsWith("video/");
  return `
    <section class="completion-panel">
      <div class="completion-panel-head">
        <div>
          <strong>Completion review</strong>
          <span>${request.status === "Provider Marked Done" ? "Provider marked this job done." : "Completion details and rating actions."}</span>
        </div>
        ${request.autoConfirmAt && request.status === "Provider Marked Done" ? `<small>Auto-confirms ${escapeHtml(formatDateTime(request.autoConfirmAt))}</small>` : ""}
      </div>
      ${firstMedia ? `
        <button class="completion-media" type="button" data-media-open data-request-id="${escapeAttribute(request.id)}" data-media-stage="completion" data-media-index="0">
          ${isVideo ? `<video preload="metadata" src="${escapeAttribute(mediaUrl)}"></video>` : `<img src="${escapeAttribute(mediaUrl)}" alt="${escapeAttribute(firstMedia.originalName || "Completion media")}">`}
          <span>${request.completionAttachments.length} proof file${request.completionAttachments.length === 1 ? "" : "s"}</span>
        </button>
      ` : ""}
      ${request.proofNote ? `<div class="completion-note"><strong>Provider note</strong><p>${escapeHtml(request.proofNote)}</p></div>` : ""}
      ${request.revisionNote ? `<div class="completion-note warning"><strong>Revision requested</strong><p>${escapeHtml(request.revisionNote)}</p></div>` : ""}
      <div class="completion-actions">
        ${request.status === "Provider Marked Done" && request.clientId === state.session?.id ? `<button class="btn btn-sm btn-success" data-request-id="${escapeAttribute(request.id)}" data-job-action="client_complete"><i class="fa-solid fa-shield-halved"></i> Confirm completed</button>` : ""}
        ${request.status === "Provider Marked Done" && request.clientId === state.session?.id ? `<button class="btn btn-sm btn-outline-warning" data-request-id="${escapeAttribute(request.id)}" data-job-action="request_revision"><i class="fa-solid fa-rotate-left"></i> Request revision</button>` : ""}
        ${(request.clientId === state.session?.id || request.acceptedProviderId === state.session?.id) && ["Accepted", "In Progress", "Provider Marked Done", "Payment Released"].includes(request.status) ? `<button class="btn btn-sm btn-outline-warning" data-request-id="${escapeAttribute(request.id)}" data-job-action="dispute"><i class="fa-solid fa-triangle-exclamation"></i> Dispute</button>` : ""}
        ${request.clientId === state.session?.id && request.status === "Payment Released" && !request.clientRatedAt ? `<button class="btn btn-sm btn-outline-primary" data-request-id="${escapeAttribute(request.id)}" data-job-action="rate"><i class="fa-solid fa-star"></i> Rate provider</button>` : ""}
      </div>
    </section>
  `;
}

function bindRequestCardActions(host) {
  $$("[data-scroll-offers]", host).forEach((button) => button.addEventListener("click", () => {
    $(`[data-offers-for="${escapeCssIdentifier(button.dataset.scrollOffers)}"]`, host)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  $$("[data-accept-client-price]", host).forEach((button) => button.addEventListener("click", () => acceptClientPrice(button.dataset.acceptClientPrice)));
  $$("[data-update-request-distance]", host).forEach((button) => button.addEventListener("click", () => updateRequestDistance(button.dataset.updateRequestDistance)));
  $$("[data-navigate-request]", host).forEach((button) => button.addEventListener("click", () => openRequestNavigation(button.dataset.navigateRequest)));
  $$("[data-open-offers-screen]", host).forEach((button) => button.addEventListener("click", () => openOffersScreen(button.dataset.openOffersScreen)));
  $$("[data-open-active-job]", host).forEach((button) => button.addEventListener("click", () => openActiveJobScreen(button.dataset.openActiveJob)));
  $$("[data-open-completed-screen]", host).forEach((button) => button.addEventListener("click", () => openCompletedJobScreen(button.dataset.openCompletedScreen)));
  $$("[data-offer]", host).forEach((button) => button.addEventListener("click", () => openOfferModal(button.dataset.offer, "offer")));
  $$("[data-pass]", host).forEach((button) => button.addEventListener("click", () => passRequest(button.dataset.pass)));
  $$("[data-edit-request]", host).forEach((button) => button.addEventListener("click", () => openRequestModal(state.requests.find((request) => request.id === button.dataset.editRequest))));
  $$("[data-select-offer]", host).forEach((button) => button.addEventListener("click", () => confirmRequest(button.dataset.requestId, button.dataset.selectOffer)));
  $$("[data-media-open]", host).forEach((button) => button.addEventListener("click", () => openMediaViewer(button.dataset.requestId, button.dataset.mediaStage, Number(button.dataset.mediaIndex))));
  $$("[data-conversation]", host).forEach((button) => button.addEventListener("click", () => openConversation(button.dataset.conversation)));
  $$("[data-job-action]", host).forEach((button) => button.addEventListener("click", () => openJobAction(button.dataset.requestId, button.dataset.jobAction)));
  $$("[data-report-job]", host).forEach((button) => button.addEventListener("click", () => openReportJobModal(button.dataset.reportJob)));
}

function renderOffers(request) {
  const offers = visibleOffers(request);
  if (!offers.length) return "";
  if (canSelectOffer(request)) {
    return `
      <section class="offers-section offer-comparison" data-offers-for="${escapeAttribute(request.id)}">
        <div class="offers-heading">
          <strong>Compare provider offers</strong>
          <span>${offers.length} candidate${offers.length === 1 ? "" : "s"}</span>
        </div>
        <div class="offers-grid">${offers.map((offer) => renderOffer(offer, request.id, true)).join("")}</div>
      </section>
    `;
  }
  return `<section class="offers-section offer-comparison" data-offers-for="${escapeAttribute(request.id)}"><strong>Your offer</strong><div class="offers-grid">${offers.map((offer) => renderOffer(offer, request.id, false)).join("")}</div></section>`;
}

function renderOffer(offer, requestId, selectable) {
  const request = state.requests.find((item) => item.id === requestId);
  const routeDistance = request?.jobLocation && offer.providerLocation ? cachedRouteDistanceKm(request.jobLocation, offer.providerLocation) : null;
  const distanceCopy = routeDistance !== null
    ? `Route ${formatDistanceKm(routeDistance)} from job site`
    : request?.jobLocation && offer.providerLocation
      ? "Calculating route distance..."
      : "";
  const reputation = offerProviderReputation(offer);
  const average = Number(reputation?.average);
  const responseRate = Number(reputation?.responseRate);
  const completedJobs = Number(reputation?.count || 0);
  return `
    <article class="offer-card" data-offer-card="${escapeAttribute(offer.id)}">
      <div class="offer-card-head">
        <span>${escapeHtml(offer.type === "counter" ? "Counter-offer" : "Offer")}</span>
      </div>
      ${renderIdentity(offer.providerName, offer.providerPhotoUrl, "Provider reputation", offerProviderReputation(offer), "compact")}
      <div class="offer-comparison-stats">
        <span><i class="fa-solid fa-star"></i>${Number.isFinite(average) ? average.toFixed(1) : "New"}</span>
        <span><i class="fa-solid fa-circle-check"></i>${completedJobs || 0} completed</span>
        ${Number.isFinite(responseRate) ? `<span><i class="fa-solid fa-reply"></i>${responseRate}% response</span>` : ""}
      </div>
      <div class="offer-price-row">
        <div><small>Price</small><strong>${escapeHtml(formatCurrency(offer.amount))}</strong></div>
        <div><small>ETA / schedule</small><span>${escapeHtml(offer.schedule || "Schedule TBD")}</span></div>
      </div>
      ${distanceCopy ? `<div class="offer-distance" data-route-distance="${escapeAttribute(requestId)}:${escapeAttribute(offer.id)}"><i class="fa-solid fa-route"></i> ${escapeHtml(distanceCopy)}</div>` : ""}
      ${offer.notes ? `<p>${escapeHtml(offer.notes)}</p>` : ""}
      <div class="offer-card-actions">
        ${canViewConversation(request) ? `<button class="btn btn-sm btn-outline-primary" type="button" data-conversation="${escapeAttribute(requestId)}"><i class="fa-solid fa-message"></i> Message</button>` : ""}
        ${selectable ? `<button class="btn btn-sm btn-success" type="button" data-request-id="${requestId}" data-select-offer="${offer.id}"><i class="fa-solid fa-user-check"></i> Confirm Hire</button>` : ""}
      </div>
    </article>
  `;
}

function openOffersScreen(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  openWorkspacePanel(renderOffersScreen(request), {
    onOpen: (panel) => bindDedicatedJobScreenActions(panel),
  });
}

function renderOffersScreen(request = {}) {
  const offers = visibleOffers(request);
  return `
    <section class="mobile-flow-screen offers-flow-screen">
      ${mobileFlowHeader("Offers")}
      ${renderMobileJobSummaryCard(request)}
      <div class="mobile-flow-section-title">
        <strong>${offers.length} Offer${offers.length === 1 ? "" : "s"} Received</strong>
        <span>${escapeHtml(formatRelativeTime(requestLastUpdate(request)) || "Updated recently")}</span>
      </div>
      <div class="mobile-flow-stack">
        ${offers.length ? offers.map((offer) => renderMobileOfferCard(offer, request)).join("") : emptyCard("No offers yet", "Providers who match this request will appear here.")}
      </div>
    </section>
  `;
}

function renderMobileJobSummaryCard(request = {}) {
  return `
    <article class="mobile-job-summary-card">
      ${renderRequestPreviewMedia(request)}
      <div>
        <strong>${escapeHtml(request.category || "Job request")}</strong>
        <span>${escapeHtml(request.area || "Pinned job site")}</span>
        <small>Posted ${escapeHtml(formatRelativeTime(request.createdAt) || "recently")}</small>
        <button class="btn btn-sm btn-outline-primary" type="button" data-open-active-job="${escapeAttribute(request.id)}">View Details</button>
      </div>
    </article>
  `;
}

function renderRequestPreviewMedia(request = {}) {
  const media = request.requestAttachments?.[0] || request.completionAttachments?.[0];
  if (!media) {
    return `
      <div class="mobile-job-thumb placeholder">
        <i class="fa-solid ${serviceIcon(request.category)}"></i>
      </div>
    `;
  }
  const url = resolveMediaUrl(media.url);
  const isVideo = media.mimeType?.startsWith("video/");
  return `
    <button class="mobile-job-thumb" type="button" data-media-open data-request-id="${escapeAttribute(request.id)}" data-media-stage="${request.requestAttachments?.[0] ? "request" : "completion"}" data-media-index="0">
      ${isVideo ? `<video preload="metadata" src="${escapeAttribute(url)}"></video>` : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(media.originalName || request.category || "Job media")}">`}
    </button>
  `;
}

function renderMobileOfferCard(offer = {}, request = {}) {
  const reputation = offerProviderReputation(offer);
  const average = Number(reputation?.average);
  const responseRate = Number(reputation?.responseRate);
  const completedJobs = Number(reputation?.count || 0);
  const service = providerServiceLabel(offer.providerId) || "Local service provider";
  return `
    <article class="mobile-offer-card">
      <div class="mobile-offer-head">
        ${mobilePersonAvatar(offer.providerName, offer.providerPhotoUrl)}
        <div>
          <strong>${escapeHtml(offer.providerName || "Provider")}</strong>
          <span>${escapeHtml(service)}</span>
          <small><i class="fa-solid fa-star"></i> ${Number.isFinite(average) ? average.toFixed(1) : "New"} ${completedJobs ? `(${completedJobs} jobs)` : ""}</small>
        </div>
        <div class="mobile-offer-price">
          <strong>${escapeHtml(formatCurrency(offer.amount))}</strong>
          <span>Estimate</span>
        </div>
      </div>
      <div class="mobile-offer-stats">
        <span><i class="fa-solid fa-calendar-check"></i> ${escapeHtml(offer.schedule || "Schedule TBD")}</span>
        ${Number.isFinite(responseRate) ? `<span><i class="fa-solid fa-reply"></i> ${responseRate}% response</span>` : ""}
      </div>
      ${offer.notes ? `<p>${escapeHtml(offer.notes)}</p>` : ""}
      <div class="mobile-offer-actions">
        <button class="btn btn-primary" type="button" data-request-id="${escapeAttribute(request.id)}" data-select-offer="${escapeAttribute(offer.id)}"><i class="fa-solid fa-user-check"></i> Hire</button>
        ${canViewConversation(request)
          ? `<button class="btn btn-outline-primary" type="button" data-conversation="${escapeAttribute(request.id)}"><i class="fa-solid fa-message"></i> Message</button>`
          : `<button class="btn btn-outline-primary" type="button" data-offer-message-soon><i class="fa-solid fa-message"></i> Message</button>`}
      </div>
    </article>
  `;
}

function openActiveJobScreen(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  openWorkspacePanel(renderActiveJobScreen(request), {
    onOpen: (panel) => bindDedicatedJobScreenActions(panel),
  });
}

function renderActiveJobScreen(request = {}) {
  const offer = acceptedOffer(request);
  const provider = userProfile(request.acceptedProviderId);
  const nav = request.navigationState || {};
  const statusCopy = navigationTargetForRequest(request)
    ? navigationStatusText(nav)
    : request.status === "Accepted" ? "Provider accepted" : request.status || "Job active";
  return `
    <section class="mobile-flow-screen active-job-screen">
      ${mobileFlowHeader(request.category || "Active Job", `<span class="mobile-flow-status">${escapeHtml(request.status || "Active")}</span>`)}
      ${renderMobileProgressTracker(request)}
      <article class="mobile-info-card">
        <div class="mobile-info-card-head">
          <strong>Provider</strong>
          <div class="mobile-contact-actions">
            ${canViewConversation(request) ? `<button type="button" data-conversation="${escapeAttribute(request.id)}" aria-label="Message provider"><i class="fa-solid fa-message"></i></button>` : ""}
            ${navigationTargetForRequest(request) ? `<button type="button" data-navigate-request="${escapeAttribute(request.id)}" aria-label="Open navigation"><i class="fa-solid fa-route"></i></button>` : ""}
          </div>
        </div>
        ${request.acceptedProviderId ? renderMobileProviderRow({
          name: request.acceptedProviderContact?.name || offer?.providerName || provider.name || "Selected provider",
          photoUrl: request.acceptedProviderPhotoUrl || offer?.providerPhotoUrl || provider.photoUrl,
          service: providerServiceLabel(request.acceptedProviderId) || "Selected provider",
          reputation: acceptedProviderReputation(request),
        }) : `<p>No provider selected yet.</p>`}
      </article>
      <article class="mobile-status-card">
        <div>
          <i class="fa-solid fa-route"></i>
          <strong>${escapeHtml(statusCopy)}</strong>
          <span>${escapeHtml(activeJobEtaText(request))}</span>
        </div>
      </article>
      <article class="mobile-info-card">
        <div class="mobile-info-card-head">
          <strong>Job Details</strong>
          <span>${escapeHtml(formatCurrency(request.budget))}</span>
        </div>
        <p>${escapeHtml(request.details || "No details provided.")}</p>
        <div class="mobile-detail-grid">
          <span><i class="fa-solid fa-location-dot"></i>${escapeHtml(request.area || "Pinned site")}</span>
          <span><i class="fa-solid fa-clock"></i>${escapeHtml(request.preferredSchedule || request.urgency || "Flexible")}</span>
        </div>
      </article>
      <div class="mobile-flow-actions">
        ${canViewConversation(request) ? `<button class="btn btn-primary" type="button" data-conversation="${escapeAttribute(request.id)}"><i class="fa-solid fa-message"></i> Contact Provider</button>` : ""}
        ${navigationTargetForRequest(request) ? `<button class="btn btn-outline-primary" type="button" data-navigate-request="${escapeAttribute(request.id)}"><i class="fa-solid fa-map-location-dot"></i> Open Navigation</button>` : ""}
        ${jobActionButtons(request)}
      </div>
    </section>
  `;
}

function openCompletedJobScreen(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  openWorkspacePanel(renderCompletedJobScreen(request), {
    onOpen: (panel) => bindCompletedJobScreen(panel, request.id),
  });
}

function renderCompletedJobScreen(request = {}) {
  const firstMedia = request.completionAttachments?.[0] || request.requestAttachments?.[0];
  const canRate = canRateRequest(request);
  return `
    <section class="mobile-flow-screen completed-job-screen">
      ${mobileFlowHeader("Job Completed")}
      <div class="completion-success">
        <span><i class="fa-solid fa-check"></i></span>
        <strong>${escapeHtml(request.category || "Job completed")}</strong>
        <small>${request.paymentReleasedAt ? `Completed ${escapeHtml(formatDateTime(request.paymentReleasedAt))}` : escapeHtml(request.status || "Ready for review")}</small>
      </div>
      <article class="mobile-info-card">
        <strong>Completion Photo</strong>
        ${firstMedia ? renderCompletionProofButton(request, firstMedia) : `<div class="completion-proof-empty"><i class="fa-solid fa-image"></i><span>No completion proof uploaded.</span></div>`}
        ${request.proofNote ? `<p>${escapeHtml(request.proofNote)}</p>` : ""}
      </article>
      <article class="mobile-rating-card">
        <strong>How was the service?</strong>
        <div class="star-rating mobile-star-rating" role="radiogroup" aria-label="Rating">
          ${[1, 2, 3, 4, 5].map((score) => `<button class="star-button selected" type="button" role="radio" aria-checked="${score === 5}" aria-label="${score} star${score === 1 ? "" : "s"}" data-rating-star="${score}">&#9733;</button>`).join("")}
        </div>
        <input id="mobile-rating-score" type="hidden" value="5">
        <textarea id="mobile-rating-note" class="form-control" rows="4" placeholder="Share what went well or what needs improvement." ${canRate ? "" : "disabled"}>${escapeHtml(existingRatingNote(request))}</textarea>
      </article>
      <div class="mobile-flow-actions">
        ${canRate ? `<button class="btn btn-primary" type="button" data-submit-mobile-rating="${escapeAttribute(request.id)}"><i class="fa-solid fa-star"></i> Submit Rating</button>` : ""}
        ${request.status === "Provider Marked Done" && request.clientId === state.session?.id ? `<button class="btn btn-outline-warning" type="button" data-request-id="${escapeAttribute(request.id)}" data-job-action="request_revision"><i class="fa-solid fa-rotate-left"></i> Request Revision</button>` : ""}
        ${(request.clientId === state.session?.id || request.acceptedProviderId === state.session?.id) && ["Provider Marked Done", "Payment Released"].includes(request.status) ? `<button class="btn btn-outline-warning" type="button" data-request-id="${escapeAttribute(request.id)}" data-job-action="dispute"><i class="fa-solid fa-triangle-exclamation"></i> Dispute</button>` : ""}
        ${request.status === "Provider Marked Done" && request.clientId === state.session?.id ? `<button class="btn btn-outline-success" type="button" data-request-id="${escapeAttribute(request.id)}" data-job-action="client_complete"><i class="fa-solid fa-shield-halved"></i> Confirm Completed</button>` : ""}
      </div>
    </section>
  `;
}

function bindDedicatedJobScreenActions(scope = document) {
  $("[data-mobile-flow-close]", scope)?.addEventListener("click", () => closeWorkspacePanel());
  $$("[data-open-active-job]", scope).forEach((button) => button.addEventListener("click", () => openActiveJobScreen(button.dataset.openActiveJob)));
  $$("[data-select-offer]", scope).forEach((button) => button.addEventListener("click", () => confirmRequest(button.dataset.requestId, button.dataset.selectOffer)));
  $$("[data-conversation]", scope).forEach((button) => button.addEventListener("click", () => openConversation(button.dataset.conversation)));
  $$("[data-navigate-request]", scope).forEach((button) => button.addEventListener("click", () => openRequestNavigation(button.dataset.navigateRequest)));
  $$("[data-job-action]", scope).forEach((button) => button.addEventListener("click", () => openJobAction(button.dataset.requestId, button.dataset.jobAction)));
  $$("[data-media-open]", scope).forEach((button) => button.addEventListener("click", () => openMediaViewer(button.dataset.requestId, button.dataset.mediaStage, Number(button.dataset.mediaIndex))));
  $$("[data-offer-message-soon]", scope).forEach((button) => button.addEventListener("click", () => notify("Messaging opens after hire", "Select a provider first to open the job conversation.", "info")));
}

function bindCompletedJobScreen(scope = document, requestId = "") {
  bindDedicatedJobScreenActions(scope);
  bindMobileStarRating(scope);
  $("[data-submit-mobile-rating]", scope)?.addEventListener("click", async () => {
    const score = Number($("#mobile-rating-score", scope)?.value || 5);
    const note = $("#mobile-rating-note", scope)?.value.trim() || "";
    try {
      const payload = await apiFetch(`/api/requests/${requestId}/action`, { method: "POST", body: JSON.stringify({ action: "rate", score, note }) });
      applyServerState(payload.state);
      notify("Rating submitted", "", "success");
      closeWorkspacePanel();
    } catch (error) {
      notify("Rating failed", error.message, "error");
    }
  });
}

function mobileFlowHeader(title, actionHtml = "") {
  return `
    <header class="mobile-flow-header">
      <button class="chat-icon-button" type="button" data-mobile-flow-close aria-label="Back">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <h2>${escapeHtml(title)}</h2>
      <div>${actionHtml}</div>
    </header>
  `;
}

function renderMobileProviderRow({ name = "Provider", photoUrl = "", service = "", reputation = {} } = {}) {
  const average = Number(reputation?.average);
  const count = Number(reputation?.count || 0);
  return `
    <div class="mobile-provider-row">
      ${mobilePersonAvatar(name, photoUrl)}
      <div>
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(service)}</span>
        <small><i class="fa-solid fa-star"></i> ${Number.isFinite(average) ? average.toFixed(1) : "New"} ${count ? `(${count} jobs)` : ""}</small>
      </div>
    </div>
  `;
}

function mobilePersonAvatar(name = "", photoUrl = "") {
  const resolved = photoUrl ? resolveMediaUrl(photoUrl) : "";
  const initials = personInitials(name);
  return resolved
    ? `<img class="mobile-person-avatar" src="${escapeAttribute(resolved)}" alt="${escapeAttribute(name || "Provider")} photo">`
    : `<span class="mobile-person-avatar initials">${escapeHtml(initials)}</span>`;
}

function personInitials(name = "") {
  const parts = String(name || "KAILA").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || "K").slice(0, 2)).toUpperCase();
}

function providerServiceLabel(providerId = "") {
  const provider = state.providers.find((item) => item.userId === providerId);
  return provider?.specificServices || provider?.skills || categoryList(provider?.category).slice(0, 2).join(", ");
}

function serviceIcon(category = "") {
  const text = String(category || "").toLowerCase();
  if (text.includes("plumb") || text.includes("sink")) return "fa-faucet-drip";
  if (text.includes("elect")) return "fa-bolt";
  if (text.includes("appliance")) return "fa-blender";
  if (text.includes("computer")) return "fa-laptop";
  if (text.includes("cell")) return "fa-mobile-screen-button";
  if (text.includes("carpent")) return "fa-hammer";
  if (text.includes("clean")) return "fa-broom";
  return "fa-briefcase";
}

function renderMobileProgressTracker(request = {}) {
  const step = jobStatusStep(request.status);
  const labels = ["Posted", "Offers", "Accepted", ["Accepted", "In Progress", "Revision Requested"].includes(request.status) ? "In Progress" : "On The Way", "Completed"];
  return `
    <div class="mobile-progress-tracker">
      ${labels.map((label, index) => `
        <span class="${index < step ? "done" : index === step ? "active" : ""}">
          <b>${index < step ? `<i class="fa-solid fa-check"></i>` : index + 1}</b>
          <em>${escapeHtml(label)}</em>
        </span>
      `).join("")}
    </div>
  `;
}

function activeJobEtaText(request = {}) {
  const nav = request.navigationState || {};
  if (nav.etaMinutes) return `ETA: ${nav.etaMinutes} minutes`;
  if (nav.providerLocation) return formatNavigationDistance(nav) ? `${formatNavigationDistance(nav)} from job site` : "Provider location is live";
  if (request.preferredSchedule) return request.preferredSchedule;
  if (request.status === "Accepted") return "Provider selected. Start or travel update is next.";
  if (request.status === "In Progress") return "Job is currently in progress.";
  return "You will be notified when the provider updates the job.";
}

function renderCompletionProofButton(request = {}, media = {}) {
  const mediaUrl = resolveMediaUrl(media.url);
  const isVideo = media.mimeType?.startsWith("video/");
  const stage = request.completionAttachments?.includes(media) ? "completion" : "request";
  return `
    <button class="completion-proof-card" type="button" data-media-open data-request-id="${escapeAttribute(request.id)}" data-media-stage="${stage}" data-media-index="0">
      ${isVideo ? `<video preload="metadata" src="${escapeAttribute(mediaUrl)}"></video>` : `<img src="${escapeAttribute(mediaUrl)}" alt="${escapeAttribute(media.originalName || "Completion media")}">`}
      <span>View Full Size</span>
    </button>
  `;
}

function canRateRequest(request = {}) {
  if (!state.session) return false;
  if (request.clientId === state.session.id) return request.status === "Payment Released" && !request.clientRatedAt;
  if (request.acceptedProviderId === state.session.id) return request.status === "Payment Released" && !request.providerRatedAt;
  return false;
}

function existingRatingNote(request = {}) {
  if (request.clientId === state.session?.id) return request.clientRatingNote || "";
  if (request.acceptedProviderId === state.session?.id) return request.providerRatingNote || "";
  return "";
}

function bindMobileStarRating(scope = document) {
  const stars = $$("[data-rating-star]", scope);
  const setRating = (score) => {
    const input = $("#mobile-rating-score", scope);
    if (input) input.value = String(score);
    stars.forEach((star) => {
      const selected = Number(star.dataset.ratingStar) <= score;
      star.classList.toggle("selected", selected);
      star.setAttribute("aria-checked", String(Number(star.dataset.ratingStar) === score));
    });
  };
  stars.forEach((star) => star.addEventListener("click", () => setRating(Number(star.dataset.ratingStar))));
}

async function updateRequestDistance(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request?.jobLocation) return;
  const location = await getDeviceLocation({ maximumAge: 30000, timeout: 12000 });
  if (!location) return;
  const routeDistance = await routeDistanceKm(location, request.jobLocation);
  notify("Distance updated", routeDistance !== null ? `Route ${formatDistanceKm(routeDistance)} from the job site.` : "Route distance unavailable.", routeDistance !== null ? "success" : "warning");
  renderDashboard();
}

async function openRequestNavigation(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  const target = navigationTargetForRequest(request);
  if (!target) {
    notify("Navigation unavailable", "This request does not have a saved destination yet.", "warning");
    return;
  }
  const origin = request.acceptedProviderId === state.session?.id
    ? (state.deviceLocation || await getDeviceLocation({ maximumAge: 30000, timeout: 8000, silent: true }))
    : normalizeLocation(request.navigationState?.providerLocation);
  await openNavigationModal({ request, target, origin });
}

function navigationSessionKey(request = {}, target = {}) {
  const destination = normalizeLocation(target.destination);
  return [request?.id || "", target.label || "", destination ? `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}` : ""].join("|");
}

function ensureNavigationSession({ request = {}, target = {}, origin = null } = {}) {
  const destination = normalizeLocation(target.destination);
  if (!destination) return null;
  const key = navigationSessionKey(request, target);
  const currentOrigin = normalizeLocation(origin) || state.navigationSession?.currentOrigin || null;
  if (state.navigationSession?.key === key) {
    state.navigationSession.request = request;
    state.navigationSession.target = target;
    state.navigationSession.destination = destination;
    state.navigationSession.label = target.label || "Destination";
    state.navigationSession.detail = target.detail || "";
    state.navigationSession.currentOrigin = currentOrigin;
    state.navigationSession.navigationState = request.navigationState || null;
    state.navigationSession.mode = target.mode || "viewer";
    state.navigationSession.providerLocation = normalizeLocation(request.navigationState?.providerLocation) || currentOrigin;
    if (isNavigationActive(request.navigationState || {})) state.navigationSession.localNavigationPhase = "";
    return state.navigationSession;
  }
  stopNavigationWatch({ clearSession: true });
  state.navigationSession = {
    key,
    request,
    target,
    destination,
    label: target.label || "Destination",
    detail: target.detail || "",
    mode: target.mode || "viewer",
    navigationState: request.navigationState || null,
    providerLocation: normalizeLocation(request.navigationState?.providerLocation) || currentOrigin,
    currentOrigin,
    minimized: false,
    modalOpen: false,
    modalShouldMinimize: false,
    modalRender: null,
    pipRender: null,
    lastRoute: null,
    localNavigationPhase: "",
  };
  return state.navigationSession;
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
        ${reputation === false ? "" : renderReputationBadge(reputationLabel, reputation)}
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

function displayUserName(user = {}) {
  if (user.role === "admin") return "KAILA Admin";
  if (user.role === "ops") return "KAILA Ops";
  if (user.role === SUPPORT_ROLE) return "KAILA Customer Service";
  return user.name || "KAILA user";
}

function displayReputationForUser(user = {}) {
  return ["client", "provider"].includes(user.role) ? user.reputation : false;
}

function canDirectContact(target = {}) {
  if (!state.session || !target.id || target.id === state.session.id || target.deletedAt) return false;
  if (isBlockedUser(target.id)) return false;
  if (state.session.role === "admin") return ["admin", "ops", SUPPORT_ROLE, "provider", "client"].includes(target.role);
  if (state.session.role === SUPPORT_ROLE) return ["admin", SUPPORT_ROLE, "provider", "client"].includes(target.role);
  if (target.role === SUPPORT_ROLE) return ["provider", "client"].includes(state.session.role);
  return state.session.role === "ops" && target.role === "admin";
}

function canViewDirectContact(target = {}) {
  if (canDirectContact(target)) return true;
  if (!state.session || !target.id || target.id === state.session.id || target.deletedAt) return false;
  return ["admin", SUPPORT_ROLE].includes(target.role) && ["admin", "ops", SUPPORT_ROLE, "provider", "client"].includes(state.session.role);
}

function canDirectCall(target = {}) {
  if (!state.session || !target.id || target.id === state.session.id || target.deletedAt) return false;
  if (isBlockedUser(target.id)) return false;
  if (state.session.role === SUPPORT_ROLE) return ["client", "provider"].includes(target.role);
  if (target.role === SUPPORT_ROLE) return ["client", "provider"].includes(state.session.role);
  if (state.session.role === "ops") return target.role === "admin";
  return state.session.role === "admin" && ["admin", "ops", SUPPORT_ROLE].includes(target.role);
}

function isBlockedUser(userId) {
  return Boolean((state.blocks || []).some((block) => block.blocked_id === userId || block.blockedId === userId));
}

function canModerateUser(target = {}) {
  return Boolean(state.session && target.id && target.id !== state.session.id && !target.deletedAt && ["client", "provider"].includes(target.role));
}

function directConversationDisplayTarget(target = {}) {
  if (target.role === "admin") return { ...target, name: "KAILA Admin", reputation: false };
  if (target.role === "ops") return { ...target, name: "KAILA Ops", reputation: false };
  if (target.role === SUPPORT_ROLE) return { ...target, name: "KAILA Customer Service", photoUrl: SUPPORT_AVATAR, reputation: false };
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
  const actions = [];
  if (canDirectContact(target)) {
    actions.push(`<button class="btn btn-sm btn-outline-primary" type="button" data-direct-chat="${target.id}"><i class="fa-solid fa-message"></i> Message</button>`);
    if (canDirectCall(target)) {
      actions.push(`<button class="btn btn-sm btn-outline-primary" type="button" data-direct-audio-call="${target.id}"><i class="fa-solid fa-phone"></i> Audio</button>`);
      actions.push(`<button class="btn btn-sm btn-outline-primary" type="button" data-direct-video-call="${target.id}"><i class="fa-solid fa-video"></i> Video</button>`);
    }
  }
  if (canModerateUser(target)) {
    actions.push(`<button class="btn btn-sm btn-outline-warning" type="button" data-report-user="${target.id}"><i class="fa-solid fa-flag"></i> Report</button>`);
    actions.push(isBlockedUser(target.id)
      ? `<button class="btn btn-sm btn-outline-secondary" type="button" data-unblock-user="${target.id}"><i class="fa-solid fa-user-check"></i> Unblock</button>`
      : `<button class="btn btn-sm btn-outline-danger" type="button" data-block-user="${target.id}"><i class="fa-solid fa-user-slash"></i> Block</button>`);
  }
  if (!actions.length) return "";
  return `
    <div class="card-actions">
      ${actions.join("")}
    </div>
  `;
}

function bindDirectContactActions() {
  $$("[data-direct-chat]").forEach((button) => button.addEventListener("click", () => openDirectConversation(button.dataset.directChat, button.dataset.directRequestId || "")));
  $$("[data-direct-audio-call]").forEach((button) => button.addEventListener("click", () => startDirectAudioCall(button.dataset.directAudioCall)));
  $$("[data-direct-video-call]").forEach((button) => button.addEventListener("click", () => startDirectVideoCall(button.dataset.directVideoCall)));
  $$("[data-report-user]").forEach((button) => button.addEventListener("click", () => openReportUserModal(button.dataset.reportUser)));
  $$("[data-block-user]").forEach((button) => button.addEventListener("click", () => blockUser(button.dataset.blockUser)));
  $$("[data-unblock-user]").forEach((button) => button.addEventListener("click", () => unblockUser(button.dataset.unblockUser)));
}

function renderProviders() {
  const host = $("[data-provider-list]");
  if (!host) return;
  if (state.session?.role === "ops") {
    host.innerHTML = "";
    return;
  }
  let providers = state.providers;
  if (canActAsMarketplace()) providers = providers.filter((provider) => !isBlockedUser(provider.userId));
  if (state.session?.role === "admin") providers = adminMetricProviders(providers);
  const adminPanel = state.session?.role === "admin" ? adminProviderMetricPanel() : "";
  if (!providers.length) {
    host.innerHTML = emptyCard("No providers yet", "Registered providers will appear here.");
    return;
  }
  host.innerHTML = `${adminPanel}${providers.map((provider) => `
    <article class="k-card provider-card" data-home-search-item="provider" data-home-search-text="${escapeAttribute(homeSearchText([provider.displayName, provider.name, provider.specificServices, provider.skills, provider.category, provider.area, provider.trustLevel]))}">
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
  applyHomeSearch();
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
  const matching = state.requests.filter((request) => categories.includes(request.category) && sameCityArea(provider.area, request.area) && request.status !== "Cancelled");
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
        <p>${activeRequests.length} active requests | ${disputedRequests.length} disputes | ${(state.reports || []).filter((report) => report.status === "Open").length} reports | ${state.users.filter((user) => user.role === "client").length} clients | ${state.providers.length} providers</p>
      </article>
      ${renderModerationReports()}
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
    ${state.session.role === "admin" ? renderModerationReports() : ""}
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
  bindCustomerServiceActions(host);
}

function renderInbox() {
  const host = $("[data-inbox-list]");
  if (!host) return;
  if (!state.session || state.session.role === "ops") {
    host.innerHTML = "";
    return;
  }

  const conversations = inboxConversations();
  const unreadCount = state.unreadMessages.length;
  const notificationText = notificationCapabilityText();
  const summary = `
    <article class="k-card inbox-summary">
      <div>
        <h3>Inbox</h3>
        <p>${unreadCount ? `${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}.` : "All caught up."} ${escapeHtml(notificationText)}</p>
      </div>
      <button class="btn btn-sm btn-outline-primary" type="button" data-inbox-refresh><i class="fa-solid fa-rotate"></i> Refresh</button>
    </article>
  `;
  if (!conversations.length) {
    host.innerHTML = `${summary}${emptyCard("No conversations yet", "Confirmed job messages and direct support chats will appear here.")}`;
    bindInboxActions(host);
    return;
  }

  host.innerHTML = `${summary}${conversations.map(renderInboxConversation).join("")}`;
  bindInboxActions(host);
}

function inboxConversations() {
  const unreadByKey = new Map(state.unreadMessages.map((message) => [message.key, message]));
  const jobThreads = state.requests
    .filter((request) => canViewConversation(request))
    .map((request) => {
      const key = `job:${request.id}`;
      const unread = unreadByKey.get(key);
      return {
        type: "job",
        key,
        id: request.id,
        title: request.category || "Job conversation",
        subtitle: conversationOtherPartyName(request),
        detail: unread?.detail || request.status || "Open job messages",
        createdAt: unread?.createdAt || request.updatedAt || request.createdAt || "",
        unread: Boolean(unread),
      };
    });
  const directThreads = state.unreadMessages
    .filter((message) => message.type === "direct")
    .map((message) => ({
      type: "direct",
      key: message.key,
      id: message.userId || message.id,
      userId: message.userId || message.id,
      requestId: message.requestId || "",
      title: message.title || "Direct message",
      subtitle: message.sender || "KAILA",
      detail: message.detail || "Sent media",
      createdAt: message.createdAt || "",
      unread: true,
    }));
  const seen = new Set();
  return [...directThreads, ...jobThreads]
    .filter((thread) => {
      if (!thread.id || seen.has(thread.key)) return false;
      seen.add(thread.key);
      return true;
    })
    .sort((left, right) => Number(right.unread) - Number(left.unread) || new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

function renderInboxConversation(thread = {}) {
  return `
    <article class="k-card inbox-item ${thread.unread ? "unread" : ""}" data-inbox-item="${escapeAttribute(thread.key)}">
      <button type="button" data-open-inbox-thread="${escapeAttribute(thread.key)}">
        <span class="inbox-icon"><i class="fa-solid ${thread.type === "direct" ? "fa-user" : "fa-briefcase"}"></i></span>
        <span class="inbox-copy">
          <strong>${escapeHtml(thread.title)}</strong>
          <small>${escapeHtml(thread.subtitle || "")}${thread.createdAt ? ` - ${escapeHtml(formatDateTime(thread.createdAt))}` : ""}</small>
          <span>${escapeHtml(thread.detail || "")}</span>
        </span>
        ${thread.unread ? `<b class="inbox-unread-dot" aria-label="Unread"></b>` : ""}
      </button>
    </article>
  `;
}

function bindInboxActions(host = document) {
  $("[data-inbox-refresh]", host)?.addEventListener("click", () => {
    syncUnreadMessageSummaries().then(() => renderInbox());
  });
  $$("[data-open-inbox-thread]", host).forEach((button) => {
    button.addEventListener("click", () => {
      const thread = inboxConversations().find((item) => item.key === button.dataset.openInboxThread);
      if (!thread) return;
      if (thread.type === "direct") openDirectConversation(thread.userId || thread.id, thread.requestId || "");
      else openConversation(thread.id);
    });
  });
}

function notificationCapabilityText() {
  if (isNativeApp() || nativePushNotifications() || nativeLocalNotifications()) {
    if (state.pushToken) return "Push alerts are active on this device.";
    if (nativePushNotifications()) return state.pushStatus || "Push alerts are waiting for device registration.";
    if (nativeLocalNotifications()) return "Local alerts are available; push plugin is not available.";
    return "Native push is not available in this build.";
  }
  if (!("Notification" in window)) return "Browser notifications are not supported here.";
  if (Notification.permission === "granted") return "Browser alerts are enabled while the PWA can receive them.";
  if (Notification.permission === "denied") return "Browser alerts are blocked in system or browser settings.";
  return "Tap anywhere and allow notifications to receive browser alerts.";
}

function renderModerationReports() {
  const reports = state.reports || [];
  if (!reports.length) return "";
  return `
    <article class="k-card admin-metric-panel">
      <h3>Safety reports</h3>
      <p>${reports.filter((report) => report.status === "Open").length} open report${reports.filter((report) => report.status === "Open").length === 1 ? "" : "s"} from users.</p>
    </article>
    ${reports.slice(0, 12).map((report) => `
      <article class="k-card">
        <div class="d-flex justify-content-between gap-2">
          <div>
            <h3>${report.type === "job" ? "Job report" : "User report"}: ${escapeHtml(report.reason)}</h3>
            <p>${escapeHtml(report.details || "No extra details")}</p>
          </div>
          <span class="badge text-bg-${report.status === "Open" ? "warning" : "secondary"} align-self-start">${escapeHtml(report.status)}</span>
        </div>
        <div class="meta">
          <span>From ${escapeHtml(report.reporterName || "User")}</span>
          ${report.reportedUserName ? `<span>About ${escapeHtml(report.reportedUserName)}</span>` : ""}
          ${report.requestCategory ? `<span>${escapeHtml(report.requestCategory)}</span>` : ""}
          <span>${formatDateTime(report.createdAt)}</span>
        </div>
        <div class="card-actions">
          ${report.requestId ? `<button class="btn btn-sm btn-outline-primary" type="button" data-support-focus-request="${escapeAttribute(report.requestId)}"><i class="fa-solid fa-clipboard-list"></i> View Job</button>` : ""}
          ${reportActionButtons(report)}
        </div>
      </article>
    `).join("")}
  `;
}

function reportActionButtons(report = {}) {
  if (!["admin", SUPPORT_ROLE].includes(state.session?.role)) return "";
  const status = report.status || "Open";
  const button = (action, label, style, icon) => `<button class="btn btn-sm btn-${style}" type="button" data-report-id="${escapeAttribute(report.id)}" data-report-action="${action}"><i class="fa-solid ${icon}"></i> ${label}</button>`;
  if (status === "Closed") return button("reopen", "Reopen", "outline-secondary", "fa-arrow-rotate-left");
  const actions = [];
  if (status !== "In Review") actions.push(button("review", "In Review", "outline-primary", "fa-eye"));
  if (status === "In Review") actions.push(button("reopen", "Reopen", "outline-secondary", "fa-arrow-rotate-left"));
  actions.push(button("close", "Close", "outline-secondary", "fa-check"));
  return actions.join("");
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
  $$("[data-report-action]", host).forEach((button) => {
    button.addEventListener("click", () => updateReportStatus(button.dataset.reportId, button.dataset.reportAction));
  });
  $$("[data-job-action]", host).forEach((button) => {
    button.addEventListener("click", () => openJobAction(button.dataset.requestId, button.dataset.jobAction));
  });
}

async function updateReportStatus(reportId, action) {
  if (!reportId || !action) return;
  try {
    const response = await apiFetch(`/api/reports/${encodeURIComponent(reportId)}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    safeApplyState(response.state);
    notify("Report updated", "", "success");
  } catch (error) {
    notify("Report update failed", error.message, "error");
  }
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
          ${renderIdentity(displayUserName(user), user.photoUrl, "Admin account", false)}
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
          ${renderIdentity(displayUserName(user), user.photoUrl, "Ops account", false)}
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
        <span>${escapeHtml(validationOperatorName(entry))}</span>
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

function validationOperatorName(entry = {}) {
  const operator = userProfile(entry.operatorId);
  if (STAFF_ROLES.includes(operator.role)) return displayUserName(operator);
  const name = String(entry.operatorName || "").trim();
  if (!name || /^(admin|ops|customer service|support)$/i.test(name)) {
    return entry.type === "provider_interview" || entry.type === "client_survey" ? "KAILA Ops" : "KAILA Staff";
  }
  return name;
}

function canEditValidationEntry(entry = {}) {
  return Boolean(["admin", "ops"].includes(state.session?.role) && entry.operatorId === state.session?.id);
}

function canDeleteValidationEntry(entry = {}) {
  return canEditValidationEntry(entry);
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
          <h3>${isAdmin ? "Admin account" : "Profile settings"}</h3>
          <p>${isAdmin ? "Manage the official KAILA administrator identity, contact path, alerts, and session." : "Update your visible name, service area, and photo."}</p>
          ${isAdmin ? `<div class="reputation-line"><span><i class="fa-solid fa-shield-halved"></i> ${escapeHtml(roleLabel(state.session.role))}</span><span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(state.session.area || "KAILA Administration")}</span></div>` : renderReputationBadge("Your reputation", state.session.reputation, "reputation-line")}
        </div>
      </div>
      <div class="settings-grid">
        <label><span>Name</span><input class="form-control" name="name" autocomplete="name" maxlength="80" value="${escapeAttribute(state.session.name || "")}" required></label>
        <label><span>Email</span><input class="form-control" name="email" type="email" autocomplete="email" maxlength="190" value="${escapeAttribute(state.session.email || "")}"></label>
        <label><span>Contact number</span><input class="form-control" name="contactNumber" type="tel" inputmode="tel" autocomplete="tel" maxlength="32" value="${escapeAttribute(state.session.contactNumber || "")}"></label>
        <label><span>${isAdmin ? "Admin contact link" : "Messenger / Facebook"}</span><input class="form-control" name="messengerLink" inputmode="url" autocomplete="url" maxlength="240" value="${escapeAttribute(state.session.messengerLink || "")}"></label>
        <label><span>${isAdmin ? "Internal contact" : "Preferred contact"}</span>${select("settings-contact-channel", CONTACT_CHANNELS, state.session.preferredContactChannel || "Messenger")}</label>
        <label><span>Best contact time</span>${select("settings-best-time", AVAILABLE_TIME_OPTIONS, state.session.bestContactTime || "", "Choose time")}</label>
        ${isAdmin ? "" : `<label class="wide"><span>Address</span>${addressFields("settings-address", state.session.area || "")}</label>`}
        ${isProvider ? `<label class="wide"><span>Service categories</span>${categoryChips("settings-category", state.session.category || "")}</label>` : ""}
        <label class="wide"><span>Theme</span>${select("settings-theme", ["System", "Light", "Dark"], capitalize(state.theme))}</label>
        <label class="wide"><span>Photo</span><input class="form-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
        ${isAdmin ? "" : `<label class="wide consent-line"><input type="checkbox" name="dataPrivacyConsent" ${state.session.dataPrivacyConsent ? "checked" : ""}> Data privacy consent for pilot matching</label>`}
      </div>
      <div class="upload-preview settings-preview" data-settings-photo-preview></div>
      <button class="btn btn-primary" type="submit">Save Settings</button>
    </form>
    ${isAdmin ? renderAdminAccountSettings() : ""}
    ${renderNotificationSettings()}
    ${renderSafetySettings()}
  `;
    $("[data-settings-form]")?.addEventListener("submit", saveSettings);
    $("#settings-theme")?.addEventListener("change", (event) => applyTheme(event.currentTarget.value.toLowerCase()));
    $("[data-delete-account]")?.addEventListener("click", deleteAccount);
    $("[data-settings-panel] [data-logout]")?.addEventListener("click", logout);
    $("[data-enable-notifications]")?.addEventListener("click", enableNotificationsFromSettings);
    $("[data-settings-panel] [data-reconnect]")?.addEventListener("click", () => connectSocket(true));
    $("[data-settings-support]")?.addEventListener("click", openCustomerServicePlatform);
    $("[data-settings-panel] [data-admin-create-account]")?.addEventListener("click", openAdminCreateAccountModal);
    $$("[data-route]", host).forEach((button) => button.addEventListener("click", () => route(button.dataset.route)));
    $$("[data-home-tab]", host).forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.homeTab)));
    $$("[data-unblock-settings]").forEach((button) => button.addEventListener("click", () => unblockUser(button.dataset.unblockSettings)));
    bindCategoryChips("settings-category");
    bindAddressGroup("settings-address");
    bindAttachmentPreview("[data-settings-form] [name='photo']", "[data-settings-photo-preview]", 1);
  } catch (error) {
    console.error("Settings render failed:", error);
    host.innerHTML = emptyCard("Settings unavailable", "Refresh the app and try again.");
  }
}

function renderAdminAccountSettings() {
  const openReports = (state.reports || []).filter((report) => report.status !== "Closed").length;
  const staffCount = state.users.filter((user) => STAFF_ROLES.includes(user.role)).length;
  const marketplaceUsers = state.users.filter((user) => ["client", "provider"].includes(user.role)).length;
  return `
    <section class="settings-card">
      <div class="settings-head">
        <div class="profile-photo safety-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
        <div>
          <h3>KAILA control scope</h3>
          <p>Admin access covers pilot users, staff accounts, provider supply, reports, validation, and marketplace operations.</p>
        </div>
      </div>
      <div class="meta">
        <span>${marketplaceUsers} marketplace users</span>
        <span>${state.providers.length} providers</span>
        <span>${staffCount} staff accounts</span>
        <span>${openReports} active reports</span>
      </div>
      <div class="card-actions mt-2">
        <button class="btn btn-sm btn-outline-primary" type="button" data-admin-create-account><i class="fa-solid fa-user-plus"></i> Create Account</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-home-tab="#customer-service-pane"><i class="fa-solid fa-headset"></i> Support Desk</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-home-tab="#validation-pane"><i class="fa-solid fa-clipboard-check"></i> Validation</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-home-tab="#activity-pane"><i class="fa-solid fa-chart-line"></i> Activity</button>
      </div>
    </section>
  `;
}

function renderNotificationSettings() {
  const browserPermission = "Notification" in window ? Notification.permission : "unsupported";
  const nativePush = (isNativeApp() || nativePushNotifications())
    ? (state.pushToken ? "Registered" : nativePushNotifications() ? "Available" : "Unavailable")
    : "Browser PWA";
  const serverStatus = state.pushServerStatus;
  const providerStatus = serverStatus?.provider;
  return `
    <section class="settings-card">
      <div class="settings-head">
        <div class="profile-photo safety-icon"><i class="fa-solid fa-bell"></i></div>
        <div>
          <h3>Realtime alerts</h3>
          <p>${escapeHtml(notificationCapabilityText())}</p>
        </div>
      </div>
      <div class="meta">
        <span>Socket: ${state.connected ? "Live" : "Offline"}</span>
        <span>Notifications: ${escapeHtml(browserPermission)}</span>
        <span>Push: ${escapeHtml(nativePush)}</span>
        ${state.pushStatus ? `<span>Status: ${escapeHtml(state.pushStatus)}</span>` : ""}
        ${serverStatus ? `<span>Server tokens: ${escapeHtml(serverStatus.tokenCount ?? "unknown")}</span>` : ""}
        ${serverStatus ? `<span>Firebase: ${serverStatus.firebase ? "Ready" : "Not ready"}</span>` : ""}
      </div>
      ${providerStatus ? `<div class="offer mt-2"><strong>Provider alert profile</strong><div>${escapeHtml(providerStatus.status || "No status")} - ${escapeHtml(providerStatus.category || "No categories")}</div></div>` : ""}
      ${serverStatus?.error ? `<div class="offer mt-2"><strong>Server status</strong><div>${escapeHtml(serverStatus.error)}</div></div>` : ""}
      ${state.pushError ? `<div class="offer mt-2"><strong>Push error</strong><div>${escapeHtml(state.pushError)}</div></div>` : ""}
      <div class="card-actions mt-2">
        <button class="btn btn-sm btn-outline-primary" type="button" data-enable-notifications><i class="fa-solid fa-bell"></i> Enable Alerts</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-reconnect><i class="fa-solid fa-plug-circle-bolt"></i> Reconnect Live</button>
      </div>
    </section>
  `;
}

async function enableNotificationsFromSettings() {
  state.userInteracted = true;
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission().catch(() => {});
  }
  await ensureNativeNotificationPermission();
  await setupPushNotifications();
  if (state.pushToken) await registerPushToken(state.pushToken).catch(() => {});
  await syncPushStatus();
  renderSettings();
  notify("Alerts checked", notificationCapabilityText(), "info");
}

function renderSafetySettings() {
  const blocked = (state.blocks || []).map((block) => {
    const userId = block.blocked_id || block.blockedId;
    const user = userProfile(userId);
    return { userId, name: displayUserName(user), role: roleLabel(user.role || "user") };
  });
  return `
    <section class="settings-card">
      <div class="settings-head">
        <div class="profile-photo safety-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <div>
          <h3>Safety, legal, and support</h3>
          <p>Review KAILA rules, contact support, manage blocked users, or delete your account.</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-outline-primary" type="button" data-route="privacy"><i class="fa-solid fa-lock"></i> Privacy Policy</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-route="terms"><i class="fa-solid fa-file-contract"></i> Terms</button>
        <button class="btn btn-sm btn-outline-primary" type="button" data-settings-support><i class="fa-solid fa-headset"></i> Contact Support</button>
      </div>
      ${blocked.length ? `
        <div class="offer mt-2">
          <strong>Blocked users</strong>
          ${blocked.map((item) => `
            <div class="d-flex justify-content-between align-items-center gap-2 mt-2">
              <span>${escapeHtml(item.name)} <small>${escapeHtml(item.role)}</small></span>
              <button class="btn btn-sm btn-outline-secondary" type="button" data-unblock-settings="${escapeAttribute(item.userId)}">Unblock</button>
            </div>
          `).join("")}
        </div>
      ` : `<div class="offer mt-2"><strong>Blocked users</strong><div>No blocked users.</div></div>`}
      ${["client", "provider"].includes(state.session.role) ? `
        <div class="offer mt-2">
          <strong>Account deletion</strong>
          <div>Delete your login and anonymize profile/contact details while retaining operational job records.</div>
          <button class="btn btn-sm btn-outline-danger mt-2" type="button" data-delete-account><i class="fa-solid fa-trash"></i> Delete Account</button>
        </div>
      ` : ""}
      <div class="offer mt-2">
        <strong>Account session</strong>
        <div>Sign out of this device.</div>
        <button class="btn btn-sm btn-outline-danger mt-2" type="button" data-logout><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
      </div>
    </section>
  `;
}

async function deleteAccount() {
  const result = await modal({
    title: "Delete account?",
    icon: "warning",
    html: `
      <div class="text-start">
        <p>This removes login access and anonymizes your profile and contact details. Job, message, report, and rating records may remain for safety and dispute history.</p>
        <label class="w-100">Type DELETE to confirm<input id="delete-account-confirmation" class="form-control mt-1" autocomplete="off"></label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Delete Account",
    preConfirm: () => {
      const confirmation = $("#delete-account-confirmation")?.value || "";
      if (confirmation.trim().toUpperCase() !== "DELETE") {
        window.Swal.showValidationMessage("Type DELETE to confirm.");
        return false;
      }
      return { confirmation };
    },
  });
  if (!result.isConfirmed) return;
  try {
    await apiFetch("/api/account", { method: "DELETE", body: JSON.stringify(result.value) });
    localStorage.removeItem(STORAGE.session);
    state.session = null;
    route("landing");
    notify("Account deleted", "Your account login has been removed.", "success");
  } catch (error) {
    notify("Deletion failed", error.message, "error");
  }
}

function renderActivity() {
  if (state.session?.role === "ops") {
    $("[data-activity-feed]").innerHTML = "";
    $("[data-live-feed]").innerHTML = "";
    return;
  }
  const missedCallCards = state.missedCalls.map(renderMissedCallActivity).join("");
  const feedNotificationCards = state.unreadNotificationItems
    .filter((item) => item.type === "feed")
    .map((item) => `<article class="k-card"><h3>${escapeHtml(item.title || "Feed update")}</h3><p>${escapeHtml(item.detail || "")}</p><small>${escapeHtml(formatDateTime(item.createdAt))}</small></article>`)
    .join("");
  const activityCards = state.activity.map((item) => `<article class="k-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join("");
  const html = missedCallCards || feedNotificationCards || activityCards
    ? `${missedCallCards}${feedNotificationCards}${activityCards}`
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
        <label class="wide" data-survey-no-recent-wrap>${questionLabel("If no, why are they still relevant?", "Required when the respondent has not needed service recently. Capture future need, household need, past experience, or why they are not in the target segment.")}<textarea id="survey-no-recent-reason" class="form-control" rows="2" placeholder="No recent need, but may need help for...">${escapeHtml(values.noRecentServiceReason || "")}</textarea></label>
        <label data-recent-service-followup>${questionLabel("Service needed", "Identifies which service categories have real local demand.")}${categorySelect("survey-service", true, values.serviceNeeded || entry?.category || "")}</label>
        <label data-recent-service-followup>${questionLabel("How did they look?", "Shows current discovery behavior and what KAILA must improve or integrate with.")}${select("survey-search-method", ["Referral", "Facebook", "Messenger", "Neighbor", "Shop", "Previous provider", "Other"], values.searchMethod || "", "Choose method")}</label>
        <label data-recent-service-followup>${questionLabel("How long did it take?", "Measures search friction and urgency. Longer search time is stronger evidence of pain.")}${select("survey-time-to-find", ["Same day", "1-2 days", "3-7 days", "More than a week", "Never found one"], values.timeToFind || "", "Choose time")}</label>
        <label data-recent-service-followup>${questionLabel("Compared prices?", "Checks whether clients already want multiple offers or are stuck with one option.")}${select("survey-compared-prices", ["Yes", "No"], values.comparedPrices || "", "Choose")}</label>
        <label data-recent-service-followup>${questionLabel("Price clear before job?", "Tests pricing transparency problems that KAILA can solve with offers and scope notes.")}${select("survey-price-clear", ["Yes", "No", "Somewhat"], values.priceClear || "", "Choose")}</label>
        <label data-recent-service-followup>${questionLabel("Satisfied with work?", "Captures quality outcome and whether current alternatives are good enough.")}${select("survey-satisfaction", ["5 - Very satisfied", "4 - Satisfied", "3 - Neutral", "2 - Unsatisfied", "1 - Very unsatisfied", "Not applicable"], values.satisfaction || "", "Choose")}</label>
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
      bindClientSurveyNeededToggle();
      if (!isEdit) bindValidationDraft("client_survey");
      bindDecisionSignalSuggestion("client_survey");
    },
    preConfirm: () => {
      const responses = clientSurveyResponses();
      if (!responses.name || !responses.area) {
        window.Swal.showValidationMessage("Name or nickname and area are required.");
        return false;
      }
      if (responses.neededProvider === "No" && !responses.noRecentServiceReason) {
        window.Swal.showValidationMessage("For a No answer, record why this respondent is still relevant or note that they are outside the target segment.");
        return false;
      }
      if (responses.neededProvider !== "No" && !responses.serviceNeeded) {
        window.Swal.showValidationMessage("Service needed is required when the respondent needed a provider recently.");
        return false;
      }
      return {
        type: "client_survey",
        subjectName: responses.name,
        area: responses.area,
        category: responses.serviceNeeded || "No recent service need",
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
  const entry = state.validationEntries.find((item) => item.id === entryId);
  if (!canEditValidationEntry(entry)) {
    notify("Validation update failed", "Only the user who conducted this entry can edit it.", "warning");
    return false;
  }
  if (entry.pendingSync) {
    updateQueuedValidationEntry(entryId, payload);
    activateTab("#validation-pane");
    notify(title, "Offline changes are stored on this device and will sync automatically when online.", "info");
    return true;
  }
  try {
    const response = await apiFetch(`/api/validation/${encodeURIComponent(entryId)}`, { method: "PUT", body: JSON.stringify(payload) });
    safeApplyState(response.state);
    activateTab("#validation-pane");
    notify(title, "Validation evidence has been updated.", "success");
    return true;
  } catch (error) {
    if (error.offline) {
      queueValidationUpdate(entry, payload);
      activateTab("#validation-pane");
      notify("Saved offline", "This edit is stored on this device and will sync automatically when online.", "info");
      return true;
    }
    notify("Validation update failed", error.message, "error");
    return false;
  }
}

async function deleteValidationEntry(entryId) {
  const entry = state.validationEntries.find((item) => item.id === entryId);
  if (!entry) return;
  if (!canDeleteValidationEntry(entry)) {
    notify("Delete failed", "Only the user who conducted this entry can delete it.", "warning");
    return;
  }
  const result = await window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    icon: "warning",
    title: "Delete validation entry?",
    text: `${entry.subjectName || "This entry"} will be removed from the Ops tracker.`,
    showCancelButton: true,
    confirmButtonText: "Delete",
    reverseButtons: true,
  });
  if (!result.isConfirmed) return;
  if (entry.pendingSync) {
    queueValidationDelete(entry);
    activateTab("#validation-pane");
    notify("Deleted offline", "This entry was removed locally. The deletion will sync automatically when online.", "info");
    return;
  }
  try {
    const response = await apiFetch(`/api/validation/${encodeURIComponent(entryId)}`, { method: "DELETE" });
    safeApplyState(response.state);
    activateTab("#validation-pane");
    notify("Validation entry deleted", "The entry was removed from the Ops tracker.", "success");
  } catch (error) {
    if (error.offline) {
      queueValidationDelete(entry);
      activateTab("#validation-pane");
      notify("Deleted offline", "This deletion is stored on this device and will sync automatically when online.", "info");
      return;
    }
    notify("Delete failed", error.message, "error");
  }
}

function cacheStateSnapshot() {
  const snapshot = {
    users: state.users,
    providers: state.providers,
    requests: state.requests,
    reports: state.reports,
    blocks: state.blocks,
    validationEntries: (state.validationEntries || []).filter((entry) => !entry.pendingSync),
    activities: state.activity,
    cachedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE.stateSnapshot, JSON.stringify(snapshot));
}

function currentValidationQueue() {
  const queue = readJson(STORAGE.validationQueue, []);
  if (!Array.isArray(queue)) return [];
  return queue.filter((item) => validationQueueOperation(item) && item?.clientId);
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
    operation: "create",
    clientId: `offline-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: state.session?.id || null,
    operatorName: displayUserName(state.session) || "KAILA Ops",
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
  const currentUserQueue = currentValidationQueue().filter((item) => !state.session?.id || item.userId === state.session.id);
  const deletedIds = new Set(currentUserQueue.filter((item) => validationQueueOperation(item) === "delete").map((item) => item.entryId));
  const updatesById = new Map(currentUserQueue.filter((item) => validationQueueOperation(item) === "update").map((item) => [item.entryId, item]));
  const serverEntries = (entries || [])
    .filter((entry) => !entry.pendingSync && !deletedIds.has(entry.id))
    .map((entry) => updatesById.has(entry.id) ? queuedValidationEntry(updatesById.get(entry.id), entry) : entry);
  const queuedEntries = currentUserQueue
    .filter((item) => validationQueueOperation(item) === "create")
    .map((item) => queuedValidationEntry(item));
  return [...queuedEntries, ...serverEntries];
}

function queuedValidationEntry(item, baseEntry = {}) {
  const payload = item.payload || {};
  return {
    ...baseEntry,
    id: item.entryId || item.clientId,
    type: payload.type || baseEntry.type,
    operatorId: item.userId || baseEntry.operatorId,
    operatorName: item.operatorName || "KAILA Ops",
    subjectName: payload.subjectName || baseEntry.subjectName || "Unsynced entry",
    area: payload.area || "",
    category: payload.category || "",
    decisionSignal: payload.decisionSignal || "",
    responses: payload.responses || {},
    notes: payload.notes || "",
    createdAt: baseEntry.createdAt || item.createdAt,
    pendingSync: true,
    pendingAction: validationQueueOperation(item),
  };
}

function validationQueueOperation(item = {}) {
  const operation = item.operation || "create";
  if (operation === "create") return item.payload ? "create" : "";
  if (operation === "update") return item.entryId && item.payload ? "update" : "";
  if (operation === "delete") return item.entryId ? "delete" : "";
  return "";
}

function refreshQueuedValidationState() {
  state.validationEntries = mergeQueuedValidationEntries((state.validationEntries || []).filter((entry) => !entry.pendingSync));
  renderConnectivity();
  renderValidation();
  renderOps();
}

function updateQueuedValidationEntry(entryId, payload) {
  const queue = currentValidationQueue();
  const item = queue.find((queued) => (queued.entryId || queued.clientId) === entryId);
  if (!item) return;
  item.payload = payload;
  item.updatedAt = new Date().toISOString();
  writeValidationQueue(queue);
  refreshQueuedValidationState();
}

function queueValidationUpdate(entry, payload) {
  const queue = currentValidationQueue();
  const existing = queue.find((item) => item.entryId === entry.id && item.userId === state.session?.id);
  const item = existing || {
    operation: "update",
    clientId: `offline-validation-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entryId: entry.id,
    userId: state.session?.id,
    operatorName: displayUserName(state.session) || entry.operatorName || "KAILA Ops",
    createdAt: new Date().toISOString(),
  };
  item.operation = "update";
  item.payload = payload;
  item.updatedAt = new Date().toISOString();
  writeValidationQueue(existing ? queue : [...queue, item]);
  refreshQueuedValidationState();
}

function queueValidationDelete(entry) {
  let queue = currentValidationQueue();
  const queuedCreate = queue.find((item) => validationQueueOperation(item) === "create" && item.clientId === entry.id);
  if (queuedCreate) {
    writeValidationQueue(queue.filter((item) => item.clientId !== entry.id));
    refreshQueuedValidationState();
    return;
  }
  queue = queue.filter((item) => !(item.entryId === entry.id && item.userId === state.session?.id));
  queue.push({
    operation: "delete",
    clientId: `offline-validation-delete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entryId: entry.id,
    userId: state.session?.id,
    operatorName: displayUserName(state.session) || entry.operatorName || "KAILA Ops",
    createdAt: new Date().toISOString(),
  });
  writeValidationQueue(queue);
  refreshQueuedValidationState();
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
      const operation = validationQueueOperation(item);
      let response;
      if (operation === "update") {
        response = await apiFetch(`/api/validation/${encodeURIComponent(item.entryId)}`, { method: "PUT", body: JSON.stringify(item.payload) });
      } else if (operation === "delete") {
        response = await apiFetch(`/api/validation/${encodeURIComponent(item.entryId)}`, { method: "DELETE" });
      } else {
        response = await apiFetch("/api/validation", { method: "POST", body: JSON.stringify(item.payload) });
      }
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
  const neededProvider = fieldValue("#survey-needed");
  const hasRecentNeed = neededProvider !== "No";
  return {
    name: fieldValue("#survey-name"),
    ageRange: fieldValue("#survey-age"),
    area: addressValue("survey-address"),
    neededProvider,
    noRecentServiceReason: fieldValue("#survey-no-recent-reason"),
    serviceNeeded: hasRecentNeed ? fieldValue("#survey-service") : "",
    searchMethod: hasRecentNeed ? fieldValue("#survey-search-method") : "",
    timeToFind: hasRecentNeed ? fieldValue("#survey-time-to-find") : "",
    hardestPart: fieldValue("#survey-hardest-part"),
    comparedPrices: hasRecentNeed ? fieldValue("#survey-compared-prices") : "",
    priceClear: hasRecentNeed ? fieldValue("#survey-price-clear") : "",
    trustFactors: fieldValue("#survey-trust-factors"),
    satisfaction: hasRecentNeed ? fieldValue("#survey-satisfaction") : "",
    wouldPostRequest: fieldValue("#survey-would-post"),
    wouldUploadMedia: fieldValue("#survey-would-upload"),
    wouldCompareOffers: fieldValue("#survey-would-compare"),
    wouldRateProvider: fieldValue("#survey-would-rate"),
    decisionSignal: fieldValue("#survey-signal"),
    notes: fieldValue("#survey-notes"),
  };
}

function bindClientSurveyNeededToggle() {
  const popup = window.Swal?.getPopup();
  if (!popup) return;
  const needed = $("#survey-needed", popup);
  const noRecentWrap = $("[data-survey-no-recent-wrap]", popup);
  const noRecentReason = $("#survey-no-recent-reason", popup);
  const recentFollowups = $$("[data-recent-service-followup]", popup);
  const sync = () => {
    const isNo = needed?.value === "No";
    if (noRecentWrap) noRecentWrap.hidden = !isNo;
    if (noRecentReason) noRecentReason.required = isNo;
    recentFollowups.forEach((field) => {
      field.hidden = isNo;
      $$("input, select, textarea", field).forEach((control) => {
        control.disabled = isNo;
      });
    });
  };
  needed?.addEventListener("change", sync);
  sync();
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
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const edgeGap = 12;
  const tooltipWidth = Math.min(320, Math.max(184, viewportWidth - edgeGap * 2));
  const center = rect.left + rect.width / 2;
  let left = Math.min(viewportWidth - edgeGap, Math.max(edgeGap, center));
  let placement = "center";
  if (center - tooltipWidth / 2 < edgeGap) {
    left = edgeGap;
    placement = "left";
  } else if (center + tooltipWidth / 2 > viewportWidth - edgeGap) {
    left = viewportWidth - edgeGap;
    placement = "right";
  }
  const showBelow = rect.top < Math.min(156, viewportHeight * 0.28);
  const top = showBelow ? rect.bottom + 8 : rect.top - 8;
  button.style.setProperty("--guide-left", `${left}px`);
  button.style.setProperty("--guide-top", `${top}px`);
  button.style.setProperty("--guide-width", `${tooltipWidth}px`);
  button.dataset.placement = placement;
  button.dataset.vertical = showBelow ? "below" : "above";
}

function bindJobLocationPicker({ root = null, initialLocation = null, getLocation, setLocation }) {
  const formRoot = root || document.querySelector(".swal2-popup") || document.querySelector("[data-workspace-panel]");
  if (!formRoot) return;
  const status = $("[data-location-status]", formRoot);
  const mapEl = $("[data-job-map]", formRoot);
  const mapWrap = $("[data-job-map-wrap]", formRoot);
  const mapModeToggle = $("[data-map-mode-toggle]", formRoot);
  const zoomInButton = $("[data-map-zoom-in]", formRoot);
  const zoomOutButton = $("[data-map-zoom-out]", formRoot);
  const currentButton = $("[data-use-current-location]", formRoot);
  const mapButton = $("[data-show-location-map]", formRoot);
  const clearButton = $("[data-clear-job-location]", formRoot);
  let map = null;
  let marker = null;
  let activeBaseLayer = "street";
  let mapLayers = {};

  const updateStatus = (source = "") => {
    const location = normalizeLocation(getLocation?.());
    clearButton?.classList.toggle("d-none", !location);
    if (!status) return;
    if (!location) {
      status.textContent = "No pin yet. Pin the job site before posting.";
      return;
    }
    status.textContent = source === "current"
      ? "Using your current GPS as the job site."
      : "Map pin saved as the job site.";
  };

  const placeMarker = (location, source = "map") => {
    const clean = normalizeLocation(location);
    if (!clean) return;
    setLocation(clean, source);
    if (map && window.L) {
      if (!marker) {
        marker = window.L.marker([clean.lat, clean.lng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const next = marker.getLatLng();
          setLocation({ lat: next.lat, lng: next.lng }, "map");
          updateStatus("map");
        });
      } else {
        marker.setLatLng([clean.lat, clean.lng]);
      }
      map.setView([clean.lat, clean.lng], Math.max(map.getZoom(), 15));
    }
    updateStatus(source);
  };

  const bindMapModeButtons = () => {
    $$("[data-map-mode]", formRoot).forEach((button) => {
      button.addEventListener("click", () => {
        setMapMode(button.dataset.mapMode || "street");
      });
    });
  };

  const updateMapModeButtons = () => {
    $$("[data-map-mode]", formRoot).forEach((button) => {
      button.classList.toggle("active", button.dataset.mapMode === activeBaseLayer);
    });
  };

  const setMapMode = (mode = "street") => {
    if (!map || !mapLayers[mode]) return;
    Object.values(mapLayers).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    mapLayers[mode].addTo(map);
    activeBaseLayer = mode;
    updateMapModeButtons();
    setTimeout(() => map?.invalidateSize(), 80);
  };

  const createResilientTileLayer = (sources, options = {}) => {
    const urls = Array.isArray(sources) ? sources : [sources];
    let index = 0;
    let layer = null;
    const create = () => {
      layer = window.L.tileLayer(urls[index], {
        maxZoom: 20,
        maxNativeZoom: 18,
        detectRetina: true,
        crossOrigin: true,
        ...options,
      });
      layer.once("tileerror", () => {
        if (index >= urls.length - 1) {
          if (status) status.textContent = "Map tiles are not loading. You can still use GPS, or try again with internet.";
          return;
        }
        const wasVisible = map?.hasLayer(layer);
        if (wasVisible) map.removeLayer(layer);
        index += 1;
        layer = create();
        if (wasVisible) layer.addTo(map);
      });
      return layer;
    };
    return create();
  };

  const createMapLayers = () => {
    const street = createResilientTileLayer([
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    ], { attribution: "&copy; OpenStreetMap", maxNativeZoom: 19 });
    const satellite = createResilientTileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxNativeZoom: 17,
    });
    const satelliteBase = createResilientTileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxNativeZoom: 17,
    });
    const labels = createResilientTileLayer([
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
    ], {
      subdomains: "abcd",
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      pane: "overlayPane",
      maxNativeZoom: 18,
    });
    mapLayers = {
      street,
      satellite,
      hybrid: window.L.layerGroup([satelliteBase, labels]),
    };
  };

  const ensureMap = () => {
    if (!mapEl || !window.L) {
      notify("Map unavailable", "Check your internet connection, then try again.", "warning");
      return null;
    }
    mapWrap?.classList.remove("d-none");
    mapModeToggle?.classList.remove("d-none");
    if (!map) {
      const center = normalizeLocation(getLocation?.()) || state.deviceLocation || DEFAULT_MAP_CENTER;
      map = window.L.map(mapEl, { zoomControl: false, preferCanvas: true }).setView([center.lat, center.lng], 16);
      createMapLayers();
      setMapMode(activeBaseLayer);
      map.on("click", (event) => placeMarker(event.latlng, "map"));
      if (initialLocation) placeMarker(initialLocation, initialLocation.source || "map");
    }
    [80, 250, 700].forEach((delay) => setTimeout(() => {
      map?.invalidateSize();
      const center = normalizeLocation(getLocation?.()) || state.deviceLocation || DEFAULT_MAP_CENTER;
      map?.setView([center.lat, center.lng], map.getZoom() || 16, { animate: false });
    }, delay));
    return map;
  };

  currentButton?.addEventListener("click", async () => {
    currentButton.disabled = true;
    try {
      const location = await getDeviceLocation({ maximumAge: 30000, timeout: 12000 });
      if (!location) {
        notify("Location unavailable", "Allow location access or pick the job site on the map.", "warning");
        return;
      }
      ensureMap();
      placeMarker(location, "current");
    } finally {
      currentButton.disabled = false;
    }
  });

  zoomInButton?.addEventListener("click", () => map?.zoomIn());
  zoomOutButton?.addEventListener("click", () => map?.zoomOut());

  mapButton?.addEventListener("click", async () => {
    if (!state.deviceLocation) await getDeviceLocation({ maximumAge: 60000, timeout: 5000, silent: true });
    ensureMap();
  });

  clearButton?.addEventListener("click", () => {
    setLocation(null, "");
    if (marker) {
      marker.remove();
      marker = null;
    }
    updateStatus("");
  });

  if (initialLocation) ensureMap();
  bindMapModeButtons();
  updateMapModeButtons();
  updateStatus(initialLocation?.source || "");
}

function parseRequestSchedule(value = "") {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : { date: "", time: "" };
}

function bindScheduledRequestFields(scope = document) {
  const urgency = $("#request-urgency", scope);
  const fields = $("[data-scheduled-fields]", scope);
  const sync = () => fields?.classList.toggle("d-none", urgency?.value !== "Scheduled");
  urgency?.addEventListener("change", sync);
  sync();
}

function requestScheduleValue(scope = document) {
  if ($("#request-urgency", scope)?.value !== "Scheduled") return "";
  const date = $("#request-schedule-date", scope)?.value || "";
  const time = $("#request-schedule-time", scope)?.value || "";
  return date && time ? `${date} ${time}` : "";
}

function bindRequestWizard(scope = document) {
  const wizard = $("[data-request-wizard]", scope);
  if (!wizard) return;
  const steps = $$("[data-wizard-step]", wizard);
  const dots = $$("[data-wizard-dot]", wizard);
  const prev = $("[data-wizard-prev]", wizard);
  const next = $("[data-wizard-next]", wizard);
  const submit = $("[data-workspace-submit]", scope);
  let current = 1;
  if (submit) submit.hidden = true;

  const updateReview = () => {
    const card = $("[data-request-review-card]", wizard);
    if (!card) return;
    const category = $("#request-category", scope)?.value || "Service request";
    const urgency = $("#request-urgency", scope)?.value || "Flexible";
    const budget = normalizeCurrencyInput($("#request-budget", scope)?.value || "") || "Open";
    const details = $("#request-details", scope)?.value.trim() || "No details yet.";
    const pinned = normalizeLocation($("[data-job-map]", scope) ? null : null);
    card.innerHTML = `
      <strong>${escapeHtml(category || "Service request")}</strong>
      <span>${escapeHtml(urgency)} · ${escapeHtml(formatCurrency(budget))}</span>
      <p>${escapeHtml(details)}</p>
      <small>${$("[data-location-status]", scope)?.textContent || "Location status unavailable"}</small>
    `;
    void pinned;
  };

  const show = (step) => {
    current = Math.max(1, Math.min(steps.length, step));
    steps.forEach((item) => {
      const active = Number(item.dataset.wizardStep) === current;
      item.hidden = !active;
      item.classList.toggle("active", active);
    });
    dots.forEach((dot) => {
      const index = Number(dot.dataset.wizardDot);
      dot.classList.toggle("done", index < current);
      dot.classList.toggle("active", index === current);
    });
    if (prev) prev.disabled = current === 1;
    if (next) next.textContent = current === steps.length ? (submit?.textContent || "Post") : "Next";
    if (submit) submit.hidden = true;
    if (current === steps.length) updateReview();
  };

  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => {
    if (current === steps.length) {
      submit?.click();
      return;
    }
    show(current + 1);
  });
  $$("input, select, textarea", wizard).forEach((field) => {
    field.addEventListener("input", updateReview);
    field.addEventListener("change", updateReview);
  });
  show(1);
}

async function openRequestModal(existing = null) {
  const editing = Boolean(existing?.id);
  let selectedJobLocation = normalizeLocation(existing?.jobLocation);
  let selectedLocationSource = existing?.jobLocationSource || existing?.jobLocation?.source || (selectedJobLocation ? "map" : "");
  let requestFormRoot = document;
  const existingSchedule = parseRequestSchedule(existing?.preferredSchedule || "");
  const result = await workspaceForm({
    title: editing ? "Edit request" : "Post request",
    html: `
      <div class="request-flow request-wizard" data-request-wizard>
        <div class="request-wizard-progress" aria-label="Post request steps">
          ${["Category", "Info", "Location", "Details", "Review"].map((label, index) => `
            <span class="${index === 0 ? "active" : ""}" data-wizard-dot="${index + 1}">
              <b>${index + 1}</b>
              <em>${escapeHtml(label)}</em>
            </span>
          `).join("")}
        </div>
        <section class="request-flow-section request-wizard-step active" data-wizard-step="1">
          <div class="request-flow-head"><b>1</b><div><strong>What service do you need?</strong><span>Choose a category</span></div></div>
          <label><span>Service category</span>${categorySelect("request-category", true, existing?.category || "")}</label>
        </section>
        <section class="request-flow-section request-wizard-step" data-wizard-step="2" hidden>
          <div class="request-flow-head"><b>2</b><div><strong>Urgency, contact, and budget</strong><span>Set timing and price expectations</span></div></div>
          <div class="request-flow-grid">
            <label><span>Urgency</span>${select("request-urgency", URGENCY_OPTIONS, existing?.urgency || "Today")}</label>
            <label><span>Contact method</span>${select("request-contact-method", CONTACT_CHANNELS, existing?.contactMethod || state.session.preferredContactChannel || "Messenger")}</label>
          </div>
          <div class="schedule-fields ${existing?.urgency === "Scheduled" ? "" : "d-none"}" data-scheduled-fields>
            <label><span>Job date</span><input id="request-schedule-date" class="form-control" type="date" value="${escapeAttribute(existingSchedule.date)}"></label>
            <label><span>Job time</span><input id="request-schedule-time" class="form-control" type="time" value="${escapeAttribute(existingSchedule.time)}"></label>
          </div>
          <label><span>Budget</span><input id="request-budget" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Open / ₱1,500.00" value="${escapeAttribute(currencyNumber(existing?.budget) || "")}"></label>
        </section>
        <section class="request-flow-section request-wizard-step" data-wizard-step="3" hidden>
          <div class="request-flow-head"><b>3</b><div><strong>Location pin/map</strong><span>Pin the actual job site</span></div></div>
          <div class="location-picker" data-location-picker>
            <div>
              <strong>Job site pin</strong>
              <small data-location-status>${selectedJobLocation ? "Pinned. Providers can see approximate distance." : "Required. Use your current GPS only if you are already at the job site."}</small>
            </div>
            <div class="location-actions">
              <button class="btn btn-sm btn-outline-primary" type="button" data-use-current-location><i class="fa-solid fa-location-crosshairs"></i> I am at the job site</button>
              <button class="btn btn-sm btn-outline-secondary" type="button" data-show-location-map><i class="fa-solid fa-map-location-dot"></i> Pick on map</button>
              <button class="btn btn-sm btn-outline-danger ${selectedJobLocation ? "" : "d-none"}" type="button" data-clear-job-location><i class="fa-solid fa-xmark"></i> Clear</button>
            </div>
            <div class="map-mode-toggle ${selectedJobLocation ? "" : "d-none"}" data-map-mode-toggle>
              <button type="button" data-map-mode="street"><i class="fa-solid fa-road"></i> Street</button>
              <button type="button" data-map-mode="satellite"><i class="fa-solid fa-earth-asia"></i> Satellite</button>
              <button type="button" data-map-mode="hybrid"><i class="fa-solid fa-layer-group"></i> Hybrid</button>
            </div>
            <div class="job-map-wrap ${selectedJobLocation ? "" : "d-none"}" data-job-map-wrap>
              <div class="job-map" data-job-map></div>
              <div class="k-map-zoom" aria-label="Map zoom controls">
                <button type="button" data-map-zoom-in aria-label="Zoom in"><i class="fa-solid fa-plus"></i></button>
                <button type="button" data-map-zoom-out aria-label="Zoom out"><i class="fa-solid fa-minus"></i></button>
              </div>
              <div class="map-hint"><i class="fa-solid fa-hand-pointer"></i> Tap map to move pin. Drag pin for finer placement.</div>
            </div>
            <small class="location-note">Satellite photos and labels may be older or incomplete in some areas. The pin is what KAILA uses for provider distance.</small>
          </div>
        </section>
        <section class="request-flow-section request-wizard-step" data-wizard-step="4" hidden>
          <div class="request-flow-head"><b>4</b><div><strong>Details and photos</strong><span>Help providers estimate before they visit</span></div></div>
          <label><span>Details</span><textarea id="request-details" class="form-control" rows="5" placeholder="What happened? What should the provider inspect or bring?">${escapeHtml(existing?.details || "")}</textarea></label>
          ${editing ? `<div class="offer"><strong>Existing media</strong><div>Existing request media stays attached. Add a new request if you need to replace photos or videos.</div></div>` : `
            <label><span>Photos or videos (up to 3 files)</span><input id="request-attachments" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label>
            <div class="upload-preview" data-request-attachment-preview></div>
          `}
        </section>
        <section class="request-flow-section request-review-section request-wizard-step" data-wizard-step="5" hidden>
          <div class="request-flow-head"><b>5</b><div><strong>Review & Post</strong><span>Confirm permissions before publishing</span></div></div>
          <div class="request-review-card" data-request-review-card>
            <strong>Ready to post</strong>
            <span>Your request will be shown to matching local providers.</span>
          </div>
          <label class="consent-line"><input id="request-forward-consent" type="checkbox" ${existing?.permissionToForward === false ? "" : "checked"}> Permission to forward request details to matching providers.</label>
          <label class="consent-line"><input id="request-rate-consent" type="checkbox" ${existing?.consentToRate === false ? "" : "checked"}> I agree to rate after completion.</label>
        </section>
        <div class="request-wizard-actions">
          <button class="btn btn-outline-secondary" type="button" data-wizard-prev disabled>Back</button>
          <button class="btn btn-primary" type="button" data-wizard-next>Next</button>
        </div>
      </div>
    `,
    confirmButtonText: editing ? "Save Changes" : "Post",
    didOpen: (workspacePanel) => {
      requestFormRoot = workspacePanel || document;
      bindScheduledRequestFields(requestFormRoot);
      bindRequestWizard(requestFormRoot);
      bindJobLocationPicker({
        root: requestFormRoot,
        initialLocation: selectedJobLocation,
        getLocation: () => selectedJobLocation,
        setLocation: (location, source) => {
          selectedJobLocation = normalizeLocation(location);
          selectedLocationSource = selectedJobLocation ? source : "";
        },
      });
      if (!editing) bindAttachmentPreview("#request-attachments", "[data-request-attachment-preview]", 3, requestFormRoot);
    },
    preConfirm: async () => {
      const scope = requestFormRoot || document;
      const attachments = editing ? [] : await readMediaAttachments("#request-attachments", scope);
      if (!attachments) return false;
      const request = {
        category: $("#request-category", scope).value,
        urgency: $("#request-urgency", scope).value,
        area: existing?.area || state.session.area || "Pinned job site",
        budget: normalizeCurrencyInput($("#request-budget", scope).value) || "Open",
        preferredSchedule: requestScheduleValue(scope),
        contactMethod: $("#request-contact-method", scope).value.trim(),
        exactLocationNotes: "",
        jobLocation: selectedJobLocation,
        jobLocationSource: selectedLocationSource,
        permissionToForward: $("#request-forward-consent", scope).checked,
        consentToRate: $("#request-rate-consent", scope).checked,
        details: $("#request-details", scope).value.trim(),
        attachments,
      };
      if (!request.category || !request.details || !request.permissionToForward || !request.consentToRate) {
        window.Swal.showValidationMessage("Category, details, forwarding permission, and rating consent are required.");
        return false;
      }
      if (request.urgency === "Scheduled" && !request.preferredSchedule) {
        window.Swal.showValidationMessage("Select the scheduled job date and time.");
        return false;
      }
      if (!request.jobLocation) {
        window.Swal.showValidationMessage("Pin the job site using current location or the map.");
        return false;
      }
      return request;
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = editing
      ? await apiFetch(`/api/requests/${existing.id}`, { method: "PUT", body: JSON.stringify(result.value) })
      : await apiFetch("/api/requests", { method: "POST", body: JSON.stringify(result.value) });
    applyServerState(payload.state);
    notify(editing ? "Request updated" : "Request posted", "", "success");
  } catch (error) {
    notify("Request failed", error.message, "error");
  }
}

async function openProviderModal() {
  const existing = state.providers.find((provider) => provider.userId === state.session.id);
  let providerFormRoot = document;
  const result = await workspaceForm({
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
    didOpen: (workspacePanel) => {
      providerFormRoot = workspacePanel || document;
      bindCategoryChips("provider-category", providerFormRoot);
      bindCategoryChips("provider-days", providerFormRoot);
      bindCategoryChips("provider-coverage", providerFormRoot);
      bindAddressGroup("provider-address", providerFormRoot);
    },
    preConfirm: () => {
      const scope = providerFormRoot || document;
      const provider = {
        category: selectedCategoryChips("provider-category", scope),
        area: addressValue("provider-address", scope),
        availability: $("#provider-availability", scope).value,
        skills: $("#provider-services", scope).value.trim(),
        displayName: $("#provider-display-name", scope).value.trim(),
        providerType: $("#provider-type", scope).value,
        specificServices: $("#provider-services", scope).value.trim(),
        yearsExperience: $("#provider-experience", scope).value,
        coverageArea: selectedCategoryChips("provider-coverage", scope).join(", "),
        emergencyAvailability: $("#provider-emergency", scope).value,
        availableDays: selectedCategoryChips("provider-days", scope).join(", "),
        availableTime: timeRangeValue("#provider-time-start", "#provider-time-end", scope),
        travelLimits: $("#provider-travel", scope).value.trim(),
        minimumFee: normalizeCurrencyInput($("#provider-minimum-fee", scope).value),
        priceRange: priceRangeValue("#provider-price-range-min", "#provider-price-range-max", scope),
        workSamples: $("#provider-work-samples", scope).value.trim(),
        certificateProof: $("#provider-certificate", scope).value.trim(),
        validIdConsent: $("#provider-valid-id", scope).checked,
        consentRequests: $("#provider-consent-requests", scope).checked,
        consentRatings: $("#provider-consent-ratings", scope).checked,
        rulesAgreement: $("#provider-rules", scope).checked,
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
    setActiveRole("provider");
    notify("Provider saved", "", "success");
  } catch (error) {
    notify("Provider failed", error.message, "error");
  }
}

async function openOfferModal(requestId, type) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  const cachedProviderRouteDistance = request.jobLocation && state.deviceLocation ? cachedRouteDistanceKm(state.deviceLocation, request.jobLocation) : null;
  const result = await modal({
    title: type === "counter" ? "Send counter-offer" : "Send offer",
    html: `
      <div class="swal-form">
        ${renderIdentity(request.clientName, request.clientPhotoUrl, "Client reputation", request.clientReputation, "compact")}
        ${request.jobLocation ? `<div class="offer"><strong>Job site route distance</strong><div data-offer-distance-copy>${cachedProviderRouteDistance !== null ? `Route ${escapeHtml(formatDistanceKm(cachedProviderRouteDistance))} from you.` : "Location access can calculate your route distance for this offer."}</div></div>` : ""}
        <label><span>Amount</span><input id="offer-amount" class="form-control" type="number" min="0" step="0.01" inputmode="decimal" placeholder="₱1,500.00"></label>
        <label><span>Schedule</span>${select("offer-schedule", URGENCY_OPTIONS, "Today")}</label>
        <label><span>Notes</span><textarea id="offer-notes" class="form-control" rows="3"></textarea></label>
      </div>
    `,
    confirmButtonText: type === "counter" ? "Send Counter" : "Send Offer",
    didOpen: async () => {
      if (!request.jobLocation) return;
      const copy = $("[data-offer-distance-copy]");
      const location = state.deviceLocation || await getDeviceLocation({ maximumAge: 30000, timeout: 6000, silent: true });
      if (!copy || !location) return;
      copy.textContent = "Calculating route distance...";
      const routeDistance = await routeDistanceKm(location, request.jobLocation);
      copy.textContent = routeDistance !== null ? `Route ${formatDistanceKm(routeDistance)} from you.` : "Route distance unavailable.";
    },
    preConfirm: async () => {
      const providerLocation = request.jobLocation
        ? (state.deviceLocation || await getDeviceLocation({ maximumAge: 30000, timeout: 6000, silent: true }))
        : null;
      if (request.jobLocation && !providerLocation) {
        window.Swal.showValidationMessage("Allow location access so clients can see your route distance.");
        return false;
      }
      const offer = {
        type,
        amount: normalizeCurrencyInput($("#offer-amount").value),
        schedule: $("#offer-schedule").value,
        notes: $("#offer-notes").value.trim(),
        providerLocation,
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
    html: `
      <div class="swal-form">
        <div class="offer"><strong>${escapeHtml(formatCurrency(request.budget))}</strong><div>Choose when you can do this job.</div></div>
        <label><span>Schedule</span>${select("accept-price-schedule", URGENCY_OPTIONS, request.urgency === "Scheduled" ? "Scheduled" : "Today")}</label>
        <div class="schedule-fields ${request.urgency === "Scheduled" ? "" : "d-none"}" data-accept-price-scheduled-fields>
          <label><span>Job date</span><input id="accept-price-date" class="form-control" type="date" value="${escapeAttribute(parseRequestSchedule(request.preferredSchedule).date)}"></label>
          <label><span>Job time</span><input id="accept-price-time" class="form-control" type="time" value="${escapeAttribute(parseRequestSchedule(request.preferredSchedule).time)}"></label>
        </div>
      </div>
    `,
    confirmButtonText: "Accept Client Price",
    didOpen: () => {
      const schedule = $("#accept-price-schedule");
      const fields = $("[data-accept-price-scheduled-fields]");
      const sync = () => fields?.classList.toggle("d-none", schedule?.value !== "Scheduled");
      schedule?.addEventListener("change", sync);
      sync();
    },
    preConfirm: async () => {
      const schedule = $("#accept-price-schedule")?.value || "";
      const date = $("#accept-price-date")?.value || "";
      const time = $("#accept-price-time")?.value || "";
      const exactSchedule = schedule === "Scheduled" ? (date && time ? `${date} ${time}` : "") : schedule;
      if (!exactSchedule) {
        window.Swal.showValidationMessage("Select your schedule for this job.");
        return false;
      }
      const providerLocation = request.jobLocation
        ? (state.deviceLocation || await getDeviceLocation({ maximumAge: 30000, timeout: 6000, silent: true }))
        : null;
      if (request.jobLocation && !providerLocation) {
        window.Swal.showValidationMessage("Allow location access so clients can see your route distance.");
        return false;
      }
      return { schedule: exactSchedule, providerLocation };
    },
  });
  if (!result.isConfirmed) return;
  try {
    const payload = await apiFetch(`/api/requests/${requestId}/offers`, {
      method: "POST",
      body: JSON.stringify({ type: "offer", amount: request.budget, schedule: result.value.schedule, notes: "Accepted client price", providerLocation: result.value.providerLocation }),
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

function openWorkspacePanel(html, { onOpen, onClose } = {}) {
  closeWorkspacePanel();
  const panel = $("[data-workspace-panel]");
  const body = $("[data-workspace-panel-body]", panel);
  if (!panel || !body) return null;
  body.innerHTML = html;
  panel.hidden = false;
  document.body.classList.add("workspace-open");
  state.activeWorkspaceCleanup = onClose || null;
  onOpen?.(panel);
  return panel;
}

function closeWorkspacePanel({ silent = false } = {}) {
  const panel = $("[data-workspace-panel]");
  const body = panel ? $("[data-workspace-panel-body]", panel) : null;
  if (!panel || panel.hidden) return;
  const cleanup = state.activeWorkspaceCleanup;
  state.activeWorkspaceCleanup = null;
  if (!silent) cleanup?.();
  panel.hidden = true;
  panel.classList.remove("workspace-panel-form");
  if (body) body.innerHTML = "";
  document.body.classList.remove("workspace-open");
}

function activeChatScope() {
  return $("[data-workspace-panel]:not([hidden]) .chat-shell")?.closest("[data-workspace-panel]")
    || window.Swal.getPopup?.()
    || document;
}

function isWorkspaceChatOpen() {
  return Boolean($("[data-workspace-panel]:not([hidden]) .chat-shell"));
}

function closeChatSurface() {
  if (isWorkspaceChatOpen()) closeWorkspacePanel();
  else window.Swal.close();
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

  openWorkspacePanel(conversationHtml(payload.messages, payload.writable, payload.activeUserIds, request), {
    onOpen: () => bindConversationInput(requestId, payload.writable),
    onClose: () => {
      closeConversationRoom(requestId);
      state.activeConversationId = null;
    },
  });
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
      ${chatHeaderHtml(`${request?.category || "Job"} messages`)}
      ${conversationIdentityHtml(request)}
      ${chatToolbarHtml(
        writable && state.session?.role !== SUPPORT_ROLE ? "Need to clarify the job?" : "Conversation",
        {
          audioAttr: writable && state.session?.role !== SUPPORT_ROLE ? `data-chat-audio-call="${request?.id || ""}"` : "",
          videoAttr: writable && state.session?.role !== SUPPORT_ROLE ? `data-chat-video-call="${request?.id || ""}"` : "",
          options: conversationOptionsHtml(request),
        },
      )}
      <div class="chat-presence" data-chat-presence>${conversationPresenceText(activeUserIds)}</div>
      <div class="chat-transcript" data-chat-transcript>${transcript}</div>
      <div class="chat-typing" data-chat-typing></div>
      ${writable ? `
        ${chatComposerHtml("job")}
        <div class="upload-preview direct-upload-preview" data-chat-attachment-preview></div>
      ` : `<div class="chat-archived">Conversation archived after job completion.</div>`}
    </div>
  `;
}

function chatHeaderHtml(title) {
  return `
    <div class="chat-header">
      <button class="chat-icon-button" type="button" data-chat-close aria-label="Close messages">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <h3>${escapeHtml(title)}</h3>
    </div>
  `;
}

function chatToolbarHtml(label, { audioAttr = "", videoAttr = "", options = "" } = {}) {
  const hasCallOptions = Boolean(audioAttr || videoAttr);
  return `
    <div class="chat-call-row">
      <span>${escapeHtml(label)}</span>
      <div class="chat-top-actions">
        ${hasCallOptions ? `
          <div class="chat-menu-wrap">
            <button class="chat-icon-button" type="button" data-chat-call-toggle aria-label="Call options" aria-expanded="false">
              <i class="fa-solid fa-phone"></i>
            </button>
            <div class="chat-popover" data-chat-call-menu hidden>
              <button type="button" ${audioAttr}><i class="fa-solid fa-phone"></i> Audio Call</button>
              <button type="button" ${videoAttr}><i class="fa-solid fa-video"></i> Video Call</button>
            </div>
          </div>
        ` : ""}
        <div class="chat-menu-wrap">
          <button class="chat-icon-button" type="button" data-chat-options-toggle aria-label="Conversation options" aria-expanded="false">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div class="chat-popover" data-chat-options-menu hidden>
            ${options || `<span class="chat-menu-empty">No options</span>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

function conversationOptionsHtml(request = {}) {
  const options = [];
  if (canReportJob(request)) {
    options.push(`<button type="button" data-chat-report-job="${request.id}"><i class="fa-solid fa-flag"></i> Report Job</button>`);
  }
  return options.join("");
}

function directConversationOptionsHtml(target = {}) {
  const options = [];
  if (canModerateUser(target)) {
    options.push(`<button type="button" data-chat-report-user="${target.id}"><i class="fa-solid fa-flag"></i> Report User</button>`);
    options.push(isBlockedUser(target.id)
      ? `<button type="button" data-chat-unblock-user="${target.id}"><i class="fa-solid fa-user-check"></i> Unblock User</button>`
      : `<button type="button" data-chat-block-user="${target.id}"><i class="fa-solid fa-user-slash"></i> Block User</button>`);
  }
  return options.join("");
}

function chatComposerHtml(kind) {
  const inputAttr = kind === "direct" ? "data-direct-chat-input" : "data-chat-input";
  const attachmentAttr = kind === "direct" ? "data-direct-chat-attachments" : "data-chat-attachments";
  const sendAttr = kind === "direct" ? "data-direct-chat-send" : "data-chat-send";
  return `
    <div class="chat-compose direct-chat-compose">
      <div class="chat-menu-wrap chat-compose-menu-wrap">
        <button class="chat-icon-button chat-plus-button" type="button" data-chat-compose-toggle aria-label="Attachment options" aria-expanded="false">
          <i class="fa-solid fa-plus"></i>
        </button>
        <div class="chat-popover chat-compose-popover" data-chat-compose-menu hidden>
          <label>
            <i class="fa-solid fa-image"></i> Photos or Videos
            <input type="file" ${attachmentAttr} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden>
          </label>
          <button type="button" data-chat-emoji-toggle><i class="fa-regular fa-face-smile"></i> Emoji</button>
        </div>
      </div>
      <textarea class="form-control" rows="1" maxlength="2000" placeholder="Message" ${inputAttr}></textarea>
      <button class="btn btn-primary chat-send-button" type="button" ${sendAttr}>Send</button>
    </div>
    <div class="chat-emoji-panel" data-chat-emoji-panel hidden>
      ${["😀", "😂", "😊", "😍", "🙏", "👍", "👌", "❤️", "🔥", "🎉", "📍", "✅", "💬", "📷", "🛠️", "⭐"].map((emoji) => `<button type="button" data-chat-emoji="${escapeAttribute(emoji)}">${emoji}</button>`).join("")}
    </div>
  `;
}

function bindChatChrome(popup, inputSelector) {
  const closeMenus = (except = null) => {
    $$('[data-chat-call-menu], [data-chat-options-menu], [data-chat-compose-menu]', popup).forEach((menu) => {
      if (menu === except) return;
      menu.hidden = true;
      const toggle = menu.parentElement?.querySelector('button[aria-expanded]');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  };
  const toggleMenu = (button, menu) => {
    if (!button || !menu) return;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const nextHidden = !menu.hidden;
      closeMenus(menu);
      menu.hidden = nextHidden;
      button.setAttribute('aria-expanded', String(!nextHidden));
    });
  };
  $('[data-chat-close]', popup)?.addEventListener('click', closeChatSurface);
  toggleMenu($('[data-chat-call-toggle]', popup), $('[data-chat-call-menu]', popup));
  toggleMenu($('[data-chat-options-toggle]', popup), $('[data-chat-options-menu]', popup));
  toggleMenu($('[data-chat-compose-toggle]', popup), $('[data-chat-compose-menu]', popup));
  popup.addEventListener('click', (event) => {
    if (!event.target.closest('.chat-menu-wrap')) closeMenus();
  });
  $$('[data-chat-call-menu] button, [data-chat-options-menu] button', popup).forEach((button) => {
    button.addEventListener('click', () => closeMenus());
  });
  $$('[data-chat-report-job]', popup).forEach((button) => button.addEventListener('click', () => openReportJobModal(button.dataset.chatReportJob)));
  $$('[data-chat-report-user]', popup).forEach((button) => button.addEventListener('click', () => openReportUserModal(button.dataset.chatReportUser)));
  $$('[data-chat-block-user]', popup).forEach((button) => button.addEventListener('click', () => blockUser(button.dataset.chatBlockUser)));
  $$('[data-chat-unblock-user]', popup).forEach((button) => button.addEventListener('click', () => unblockUser(button.dataset.chatUnblockUser)));
  $('[data-chat-emoji-toggle]', popup)?.addEventListener('click', (event) => {
    event.stopPropagation();
    const panel = $('[data-chat-emoji-panel]', popup);
    if (panel) panel.hidden = !panel.hidden;
  });
  $$('[data-chat-emoji]', popup).forEach((button) => {
    button.addEventListener('click', () => insertComposerText(inputSelector, button.dataset.chatEmoji || ''));
  });
}

function insertComposerText(inputSelector, text) {
  const input = $(inputSelector);
  if (!input || !text) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
  const cursor = start + text.length;
  input.focus();
  input.setSelectionRange(cursor, cursor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
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
  if (["admin", "ops", SUPPORT_ROLE].includes(sender.role)) return displayUserName(sender);
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
  const popup = activeChatScope();
  $$("[data-direct-media-open]", popup).forEach((button) => {
    button.addEventListener("click", () => {
      const attachments = readJsonFromString(button.dataset.directMediaItems, []);
      openDirectMediaViewer(attachments, Number(button.dataset.directMediaOpen || 0));
    });
  });
  $("[data-chat-audio-call]", popup)?.addEventListener("click", () => startAudioCall(requestId));
  $("[data-chat-video-call]", popup)?.addEventListener("click", () => startVideoCall(requestId));
  bindChatChrome(popup, "[data-chat-input]");
  if (!writable) return;
  const input = $("[data-chat-input]", popup);
  $("[data-chat-send]", popup)?.addEventListener("click", () => sendConversationMessage(requestId));
  bindAttachmentPreview("[data-chat-attachments]", "[data-chat-attachment-preview]", 3);
  $$("[data-chat-react]", popup).forEach((button) => button.addEventListener("click", () => toggleMessageReaction(requestId, button.dataset.chatReact)));
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
  if (state.activeConversationId !== requestId || !isWorkspaceChatOpen()) return;
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
  if (state.activeConversationId !== requestId || !isWorkspaceChatOpen()) return;
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

  openWorkspacePanel(directConversationHtml(payload.messages, payload.writable, payload.activeUserIds, payload.target || target, payload.requestContext), {
    onOpen: () => bindDirectConversationInput(userId, payload.writable, requestId),
    onClose: () => {
      closeDirectConversationRoom(userId);
      state.activeDirectConversationUserId = null;
      state.activeDirectConversationRequestId = "";
    },
  });
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
      ${chatHeaderHtml(directConversationTitle(target, requestContext))}
      <div class="chat-reputation">${renderIdentity(displayTarget.name || "Direct contact", displayTarget.photoUrl, `${roleLabel(displayTarget.role || "user")} account`, displayReputationForUser(displayTarget), "compact")}</div>
      ${requestContext ? directConversationTopicHtml(requestContext) : ""}
      ${canDirectCall(target) ? `
        ${chatToolbarHtml(`${roleLabel(displayTarget.role || "contact")} direct line`, {
          audioAttr: `data-chat-direct-audio-call="${target.id || ""}"`,
          videoAttr: `data-chat-direct-video-call="${target.id || ""}"`,
          options: directConversationOptionsHtml(target),
        })}
      ` : chatToolbarHtml("Conversation", { options: directConversationOptionsHtml(target) })}
      <div class="chat-presence" data-direct-chat-presence>${conversationPresenceText(activeUserIds)}</div>
      <div class="chat-transcript" data-chat-transcript>${transcript}</div>
      ${writable ? `
        ${chatComposerHtml("direct")}
        <div class="upload-preview direct-upload-preview" data-direct-chat-attachment-preview></div>
      ` : `<div class="chat-archived">This direct conversation is read-only.</div>`}
    </div>
  `;
}

function bindDirectConversationInput(userId, writable, requestId = "") {
  scrollConversationToBottom();
  startDirectConversationPolling(userId);
  const popup = activeChatScope();
  $$("[data-direct-media-open]", popup).forEach((button) => {
    button.addEventListener("click", () => {
      const attachments = readJsonFromString(button.dataset.directMediaItems, []);
      openDirectMediaViewer(attachments, Number(button.dataset.directMediaOpen || 0));
    });
  });
  $("[data-chat-direct-audio-call]", popup)?.addEventListener("click", () => startDirectAudioCall(userId));
  $("[data-chat-direct-video-call]", popup)?.addEventListener("click", () => startDirectVideoCall(userId));
  bindChatChrome(popup, "[data-direct-chat-input]");
  if (!writable) return;
  const input = $("[data-direct-chat-input]", popup);
  $("[data-direct-chat-send]", popup)?.addEventListener("click", () => sendDirectConversationMessage(userId, requestId));
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
  if (state.activeDirectConversationUserId !== userId || state.activeDirectConversationRequestId !== requestId || !isWorkspaceChatOpen()) return;
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
  if (!otherUserId || state.activeDirectConversationUserId !== otherUserId || !isWorkspaceChatOpen()) return;
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
let callWakeLock = null;
let socketDisconnectCallTimer = null;

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
    await ensureCallSocketReady();
  }
  if (!await ensureCallSocketReady()) return notify("Audio call unavailable", "Live socket is still offline or not signed in. Reopen KAILA and try again.", "warning");
  if (state.call) return notify("Call already active", "End the current call before starting another.", "warning");
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !canViewConversation(request)) return;
  try {
    const call = createCallState(requestId, createBrowserId(), "outgoing", conversationOtherPartyName(request), conversationOtherPartyPhoto(request), withVideo);
    state.call = call;
    renderCallPanel();
    requestCallWakeLock();
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
    await ensureCallSocketReady();
  }
  if (!await ensureCallSocketReady()) return notify("Audio call unavailable", "Live socket is still offline or not signed in. Reopen KAILA and try again.", "warning");
  if (state.call) return notify("Call already active", "End the current call before starting another.", "warning");
  try {
    const displayTarget = directConversationDisplayTarget(target);
    const call = createCallState("", createBrowserId(), "outgoing", displayTarget.name, displayTarget.photoUrl || target.photoUrl, withVideo, { directUserId: userId });
    state.call = call;
    renderCallPanel();
    requestCallWakeLock();
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
    audioOutputMode: "earpiece",
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
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
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
      requestCallWakeLock();
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
  audio.playsInline = true;
  document.body.appendChild(audio);
  return audio;
}

function syncCallMedia(call = state.call) {
  if (!call) return;
  const audio = ensureRemoteAudio();
  if (audio.srcObject !== call.remoteStream) audio.srcObject = call.remoteStream;
  applyCallAudioOutput(call, audio);
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

async function applyCallAudioOutput(call = state.call, audio = ensureRemoteAudio()) {
  if (!call || !audio) return;
  // Browser limitation: PWAs cannot directly select the phone earpiece, speaker,
  // ringtone stream, or notification stream the way native Android/iOS apps can.
  // WebRTC audio normally uses the browser's "communications" route on phones,
  // which is the closest web equivalent to a default earpiece call. setSinkId()
  // is available only in some browsers and usually not on mobile.
  if (!audio.setSinkId) {
    audio.dataset.outputMode = call.audioOutputMode;
    return;
  }
  try {
    let sinkId = "";
    if (call.audioOutputMode === "speaker" && navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const speaker = devices.find((device) => device.kind === "audiooutput" && /speaker|loud/i.test(device.label));
      sinkId = speaker?.deviceId || "";
    }
    if (audio.sinkId !== sinkId) await audio.setSinkId(sinkId);
  } catch (error) {
    console.warn("KAILA could not change call audio output:", error);
  }
}

async function toggleCallAudioOutput() {
  const call = state.call;
  if (!call) return;
  call.audioOutputMode = call.audioOutputMode === "speaker" ? "earpiece" : "speaker";
  await applyCallAudioOutput(call);
  renderCallPanel();
  if (call.audioOutputMode === "speaker" && !ensureRemoteAudio().setSinkId) {
    notify("Speaker control limited", "This mobile browser does not let PWAs force loudspeaker output. Use the phone/browser audio route controls if available.", "info");
  }
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
            <button class="audio-call-control" type="button" data-call-output>
              <span><i class="fa-solid fa-volume-${call.audioOutputMode === "speaker" ? "high" : "low"}"></i></span>
              <b>${call.audioOutputMode === "speaker" ? "Speaker" : "Earpiece"}</b>
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
  $("[data-call-output]", panel)?.addEventListener("click", toggleCallAudioOutput);
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
    clearNativeCallNotification(call.callId);
    state.pendingNativeCallAction = "";
    state.pendingNativeCallId = "";
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
  clearNativeCallNotification(state.call.callId);
  state.pendingNativeCallAction = "";
  state.pendingNativeCallId = "";
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
  clearNativeCallNotification(state.call.callId);
  if (notifyOther) emitCallSignal("hangup");
  clearTimeout(state.call.ringingTimer);
  clearTimeout(state.call.cameraRecoveryTimer);
  clearTimeout(state.call.remoteRecoveryTimer);
  stopCallTone();
  state.call.localStream?.getTracks().forEach((track) => track.stop());
  state.call.peerConnection?.close();
  state.call = null;
  releaseCallWakeLock();
  clearInterval(callClockTimer);
  callClockTimer = null;
  stopCallQualityMonitor();
  renderCallPanel();
}

function clearNativeCallNotification(callId) {
  nativeKailaBridge()?.cancelIncomingCall?.().catch(() => {});
  const notifications = nativeLocalNotifications();
  if (!notifications || !callId) return;
  const descriptor = { id: nativeNotificationId(`kaila-call-${callId}`) };
  notifications.cancel({ notifications: [descriptor] }).catch(() => {});
  notifications.removeDeliveredNotifications?.({ notifications: [descriptor] }).catch(() => {});
}

function clearNativeJobRequestNotification(requestId) {
  const notifications = nativeLocalNotifications();
  if (!notifications || !requestId) return;
  const descriptor = { id: nativeNotificationId(`kaila-job-request-${requestId}`) };
  notifications.cancel({ notifications: [descriptor] }).catch(() => {});
  notifications.removeDeliveredNotifications?.({ notifications: [descriptor] }).catch(() => {});
}

function emitCallSignal(type, extra = {}) {
  if (!state.call || !state.socket) return;
  const signal = {
    requestId: state.call.requestId,
    directUserId: state.call.directUserId,
    callId: state.call.callId,
    type,
    ...extra,
  };
  sendCallSignal(signal, false);
}

async function sendCallSignal(signal, retried = false) {
  const type = signal.type;
  if (!state.call || signal.callId !== state.call.callId) return;
  if (!await ensureCallSocketReady()) {
    if (type === "candidate" || !state.call) return;
    endAudioCall(false);
    notify("Audio call", "Live socket is not ready. Reopen KAILA and try again.", "error");
    return;
  }
  state.socket.timeout(type === "candidate" ? CALL_CANDIDATE_TIMEOUT_MS : CALL_SIGNAL_TIMEOUT_MS).emit("kaila.call.signal", signal, (error, response = {}) => {
    if (error) {
      if (type === "candidate" || !state.call) return;
      if (!retried) {
        setTimeout(() => sendCallSignal(signal, true), 700);
        return;
      }
      endAudioCall(false);
      notify("Audio call", "Call signaling timed out after retry. Check that both users show Live, then try again.", "error");
      return;
    }
    if (response.ok || !state.call) return;
    if (response.code === "call_expired") {
      endAudioCall(false);
      notify("Audio call", response.error || "This call already ended. Ask the caller to try again.", "warning");
      return;
    }
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
    if (state.call?.callId === signal.callId) {
      if (signal.description && !state.call.remoteDescription) state.call.remoteDescription = signal.description;
      route("app");
      setCallMinimized(false);
      if (state.pendingNativeCallAction === "answer-call") acceptAudioCall();
      if (state.pendingNativeCallAction === "decline-call") declineAudioCall();
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
    requestCallWakeLock();
    startCallTone("incoming");
    notifyIncomingCall(senderName, state.call.requestedVideo);
    if (!state.pendingNativeCallId || state.pendingNativeCallId === signal.callId) {
      if (state.pendingNativeCallAction === "answer-call") acceptAudioCall();
      if (state.pendingNativeCallAction === "decline-call") declineAudioCall();
    }
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
  const notificationOptions = {
    body: `${senderName || "Your job contact"} is calling.`,
    tag: state.call?.callId ? `kaila-call-${state.call.callId}` : "kaila-call",
    requireInteraction: true,
    renotify: true,
    silent: false,
    urgency: "call",
    data: { action: "open-call" },
    actions: [
      { action: "open-call", title: "Open KAILA" },
    ],
  };
  showNativeIncomingCall(senderName, callType)
    .then((shown) => {
      if (!shown) showSystemNotification(`Incoming KAILA ${callType} call`, notificationOptions);
    })
    .catch(() => showSystemNotification(`Incoming KAILA ${callType} call`, notificationOptions));
}

function startCallTone(mode) {
  if (!state.userInteracted) return;
  stopCallTone();
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  // Browser limitation: Web Audio from a PWA is treated as page/media audio.
  // Browsers do not expose Android/iOS ringtone or notification volume streams
  // to JavaScript, so KAILA can only request a loud, persistent tone and system
  // notification; the OS/browser decides the final volume behavior.
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
    emitCallSignal("hangup", { reason: "timeout" });
    endAudioCall(false);
    notify("Audio call", "No answer.", "info");
  }, CALL_RING_TIMEOUT_MS);
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

async function readMediaAttachments(selector, scope = document) {
  const files = Array.from($(selector, scope)?.files || []);
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

function bindAttachmentPreview(inputSelector, previewSelector, limit = 3, scope = document) {
  const input = $(inputSelector, scope);
  const preview = $(previewSelector, scope);
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
    email: form.elements.email?.value.trim() || "",
    area: state.session.role === "admin" ? state.session.area || "KAILA Administration" : addressValue("settings-address"),
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
        <label><span>Email</span><input id="admin-account-email" class="form-control" type="email" autocomplete="email" maxlength="190"></label>
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
        email: $("#admin-account-email").value.trim(),
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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });
    state.socket.on("connect", () => {
      state.connected = true;
      state.socketIdentityUserId = "";
      clearTimeout(socketDisconnectCallTimer);
      socketDisconnectCallTimer = null;
      updateSocketStatus("connected");
      stopRealtimePolling();
      state.socket.emit("subscribe", CHANNEL);
      syncSocketIdentity();
      syncQueuedValidationEntries();
    });
    state.socket.on("disconnect", () => {
      state.connected = false;
      state.socketIdentityUserId = "";
      updateSocketStatus("offline");
      startRealtimePolling();
      if (state.call) {
        state.call.status = "reconnecting";
        renderCallPanel();
        clearTimeout(socketDisconnectCallTimer);
        socketDisconnectCallTimer = setTimeout(() => {
          if (state.connected || !state.call) return;
          endAudioCall(false);
          notify("Audio call", "The live connection was lost.", "warning");
        }, 15000);
      }
    });
    state.socket.on("connect_error", (error) => {
      state.connected = false;
      state.socketIdentityUserId = "";
      updateSocketStatus("offline");
      startRealtimePolling();
      addActivity("Socket connection failed", `${socketUrl} - ${error?.message || "Connection error"}`);
    });
    state.socket.on("kaila.state.updated", applyServerState);
    state.socket.on("kaila.feed.updated", () => {
      if (state.session) loadFeed({ silent: true, force: true }).catch(() => {});
    });
    state.socket.on("kaila.feed.notification", (notification) => {
      if (!notification || notification.recipientId !== state.session?.id) return;
      addUnreadNotification(notificationItemFromFeed(notification));
      playAttentionTone("update");
      vibrateAfterInteraction([280, 90, 280]);
      showSystemNotification(`KAILA: ${notification.title || "Feed update"}`, {
        body: notification.body || "New feed activity.",
        tag: "kaila-feed",
        urgency: "update",
        data: {
          action: "open-notifications",
          id: notification.id,
          postId: notification.postId,
          commentId: notification.commentId || "",
          createdAt: notification.createdAt,
        },
        actions: [{ action: "open-notifications", title: "Open KAILA" }],
      });
    });
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
    state.socket.on("kaila.navigation.start", (payload) => {
      navigationDebug("kaila.navigation.start received", { requestId: payload?.requestId, hasState: Boolean(payload?.navigationState) });
      handleNavigationStateUpdate(payload);
    });
    state.socket.on("kaila.navigation.location", (payload) => {
      navigationDebug("kaila.navigation.location received", { requestId: payload?.requestId, hasState: Boolean(payload?.navigationState) });
      handleNavigationStateUpdate(payload);
    });
    state.socket.on("kaila.navigation.arrival_state", handleNavigationStateUpdate);
    state.socket.on("kaila.navigation.stop", handleNavigationStateUpdate);
    state.socket.on("kaila.navigation.state", (payload) => {
      navigationDebug("kaila.navigation.state event received", { requestId: payload?.requestId, hasState: Boolean(payload?.navigationState) });
      handleNavigationStateUpdate(payload);
    });
    state.socket.on("kaila.socket.identified", ({ userId } = {}) => {
      state.socketIdentityUserId = userId || "";
    });
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
      if (missedCall.callerId !== state.session.id) {
        announceAttentionEvent("Missed call", `${missedCall.callerName || "A KAILA user"} tried to call${missedCall.contextTitle ? ` about ${missedCall.contextTitle}` : ""}.`, "urgent");
      }
      renderActivity();
    });
  }).catch((error) => {
    updateSocketStatus("offline");
    startRealtimePolling();
    addActivity("Socket offline", `${socketUrl} - ${error?.message || "Could not load Socket.IO client."}`);
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

async function ensureCallSocketReady(timeout = CALL_SIGNAL_TIMEOUT_MS) {
  if (!await ensureSocketConnected(timeout)) return false;
  if (state.socketIdentityUserId === state.session?.id) return true;
  return syncSocketIdentity(timeout);
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

function syncSocketIdentity(timeout = 8000) {
  if (!state.socket?.connected || !state.session?.id) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      state.socket?.off?.("kaila.socket.identified", onIdentified);
      resolve(result);
    };
    const onIdentified = ({ userId } = {}) => {
      state.socketIdentityUserId = userId || "";
      if (userId === state.session?.id) finish(true);
    };
    const timer = setTimeout(() => finish(state.socketIdentityUserId === state.session?.id), timeout);
    state.socket.on("kaila.socket.identified", onIdentified);
    state.socket.emit("identify", state.session.id, (response = {}) => {
      if (response.ok && response.userId === state.session?.id) {
        state.socketIdentityUserId = response.userId;
        finish(true);
      }
    });
  });
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

function upsertRequest(request = {}) {
  if (!request?.id) return;
  const index = state.requests.findIndex((item) => item.id === request.id);
  if (index >= 0) state.requests[index] = { ...state.requests[index], ...request };
  else state.requests = [request, ...state.requests];
  render();
}

function handleNavigationStateUpdate({ requestId, navigationState } = {}) {
  if (!requestId || !navigationState) return;
  navigationDebug("kaila.navigation.state received", {
    requestId,
    status: navigationState.status,
    arrivalState: navigationState.arrivalState,
    startedAt: navigationState.startedAt,
    hasProviderLocation: Boolean(navigationState.providerLocation),
  });
  const request = state.requests.find((item) => item.id === requestId);
  if (request) request.navigationState = navigationState;
  if (state.navigationSession?.request?.id === requestId) {
    state.navigationSession.request = request || state.navigationSession.request;
    state.navigationSession.navigationState = navigationState;
    state.navigationSession.providerLocation = normalizeLocation(navigationState.providerLocation);
    if (isNavigationActive(navigationState)) state.navigationSession.localNavigationPhase = "";
    state.navigationSession.lastRoute = null;
    state.navigationSession.modalRender?.();
    state.navigationSession.pipRender?.();
  }
  renderRequests();
  renderInbox();
  if (["nearby", "arrived"].includes(navigationState.arrivalState)) {
    notify(navigationState.arrivalState === "arrived" ? "Provider arrived" : "Provider nearby", navigationState.arrivalState === "arrived" ? "Arrival is recorded, but the job still needs normal completion." : "The provider is close to the job site.", "info");
  }
}

function hasProviderCapability() {
  return Boolean(ownProviderProfile());
}

function shouldUseProviderModeForRequest(request = {}) {
  return Boolean(hasProviderCapability() && request.clientId !== state.session?.id && providerMatchesRequest(request));
}

function activateProviderMode() {
  if (!canUseRole("provider")) return false;
  state.activeRole = "provider";
  localStorage.setItem(STORAGE.activeRole, "provider");
  return true;
}

function handleRequestCreated({ request } = {}) {
  if (!request || !state.session || request.clientId === state.session.id) return;
  if (!hasProviderCapability()) return;
  if (!providerMatchesRequest(request)) return;
  upsertRequest(request);
  loadState({ silent: true }).catch(() => {});
  if (canActAsProvider() && $("#requests-pane")?.classList.contains("active")) {
    clearJobRequestNotification(request.id);
    return;
  }
  const client = userProfile(request.clientId);
  announceJobRequestAttention(request);

  queueAttentionModal({
    customClass: { popup: "kaila-popup attention-request-popup" },
    title: "New job request",
    confirmButtonText: "Offer/Counter",
    onConfirm: () => {
      activateProviderMode();
      openOfferModal(request.id, "offer");
    },
    denyButtonText: hasClientPrice(request) ? "Accept Client Price" : undefined,
    showDenyButton: hasClientPrice(request),
    onDeny: () => {
      activateProviderMode();
      acceptClientPrice(request.id);
    },
    cancelButtonText: "Decline/Pass",
    showCancelButton: true,
    onCancel: () => {
      activateProviderMode();
      persistPassRequest(request.id);
    },
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

function announceJobRequestAttention(request = {}) {
  const detail = `${request.category || "Job request"} in ${request.area || "your service area"}${request.urgency ? ` - ${request.urgency}` : ""}`;
  const data = { action: "job-request", requestId: request.id || "", id: request.id || "" };
  addUnreadNotification();
  startPersistentAttention("New job request", detail, {
    tag: `kaila-job-request-${request.id || "latest"}`,
    data,
    actions: [{ action: "job-request", title: "View request" }],
    durationMs: 60000,
  });
  showSystemNotification("KAILA: New job request", {
    body: detail,
    tag: `kaila-job-request-${request.id || "latest"}`,
    requireInteraction: true,
    renotify: true,
    silent: false,
    urgency: "job",
    data,
    actions: [{ action: "job-request", title: "View request" }],
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
    confirmButtonText: "Review offer",
    onConfirm: () => focusRequestCard(request.id, enrichedOffer.id || offer.id),
    didOpen: () => {
      state.activeOfferPromptRequestId = request.id;
      hydrateOfferRouteDistances(document.querySelector(".swal2-popup") || document);
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
          ${renderOfferRouteDistanceLine(request, enrichedOffer)}
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
    confirmButtonText: "Review offers",
    onConfirm: () => focusRequestCard(request.id),
    didOpen: () => {
      state.activeOfferPromptRequestId = request.id;
      bindCompactOfferButtons(request.id);
      hydrateOfferRouteDistances(document.querySelector(".swal2-popup") || document);
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
    confirmButtonText: "Review offers",
    showDenyButton: false,
    showCancelButton: false,
  });
  bindCompactOfferButtons(request.id);
  hydrateOfferRouteDistances(document.querySelector(".swal2-popup") || document);
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

function renderOfferRouteDistanceLine(request, offer) {
  if (!request?.jobLocation || !offer?.providerLocation) return "";
  const routeDistance = cachedRouteDistanceKm(request.jobLocation, offer.providerLocation);
  const copy = routeDistance !== null ? `Route ${formatDistanceKm(routeDistance)} from job site` : "Calculating route distance...";
  return `<span class="offer-distance" data-route-distance="${escapeAttribute(request.id)}:${escapeAttribute(offer.id)}"><i class="fa-solid fa-route"></i> ${escapeHtml(copy)}</span>`;
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
          ${renderOfferRouteDistanceLine(request, offer)}
          ${offer.notes ? `<span>${escapeHtml(offer.notes)}</span>` : ""}
        </div>
      </div>
    `,
    didOpen: () => hydrateOfferRouteDistances(document.querySelector(".swal2-popup") || document),
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
  const senderName = chatMessageSenderName(message);
  addUnreadMessage({
    type: "job",
    id: requestId,
    messageId: message.id,
    title: request.category,
    sender: senderName,
    detail: message.detail,
    createdAt: message.createdAt,
  });
  announceAttentionEvent("New job message", `${senderName}: ${message.detail || "Sent media"}`, "message", {
    action: "message",
    type: "message",
    requestId,
    messageId: message.id || "",
  });

  queueAttentionModal({
    icon: "info",
    title: "New job message",
    confirmButtonText: "Open messages",
    onConfirm: () => openConversation(requestId),
    html: `
      <div class="text-start">
        <strong>${escapeHtml(senderName)}</strong>
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
    messageId: message.id,
    title: displayUserName(sender) || message.senderName || "Direct message",
    sender: senderName,
    detail: message.detail,
    createdAt: message.createdAt,
  });
  announceAttentionEvent("New direct message", `${senderName}: ${message.detail || "Sent media"}`, "message", {
    action: "direct-message",
    type: "direct-message",
    userId: otherUserId,
    requestId,
    messageId: message.id || "",
  });

  queueAttentionModal({
    icon: "info",
    title: "New direct message",
    confirmButtonText: "Open messages",
    onConfirm: () => openDirectConversation(otherUserId, requestId),
    html: `
      <div class="text-start">
        ${renderIdentity(displayUserName(sender), sender.role === SUPPORT_ROLE && ["client", "provider"].includes(state.session.role) ? SUPPORT_AVATAR : sender.photoUrl, `${roleLabel(sender.role || "user")} account`, displayReputationForUser(sender), "compact")}
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
  clearJobRequestNotification(requestId);
  await loadState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !isRequestParty(request) || actorId === state.session?.id) return;
  announceAttentionEvent("Offer confirmed", `${request.category} is now confirmed. Messaging and audio calls are open.`, "confirmed");
}

async function handleRequestAction({ requestId, action, status, actorId } = {}) {
  if (["cancel", "support_cancel_request", "auto_confirm", "rating_window_closed"].includes(action) || ["Cancelled", "Accepted", "In Progress", "Provider Marked Done", "Payment Released", "Rated / Closed", "Resolved"].includes(status)) {
    clearJobRequestNotification(requestId);
  }
  const existing = state.requests.find((item) => item.id === requestId);
  if (existing && status) {
    upsertRequest({ id: requestId, status });
  }
  await loadState({ silent: true });
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

function announceAttentionEvent(title, detail = "", kind = "update", data = {}) {
  if (kind !== "message") addUnreadNotification();
  if (kind === "urgent") startPersistentAttention(title, detail);
  else {
    playAttentionTone(kind);
    vibrateAfterInteraction([280, 90, 280, 90, 420]);
  }
  showSystemNotification(`KAILA: ${title}`, {
    body: detail,
    tag: `kaila-${kind}`,
    requireInteraction: kind === "urgent",
    renotify: kind === "urgent",
    silent: false,
    urgency: kind,
    data: Object.keys(data).length ? data : { action: "open-notifications" },
    actions: [{ action: data.action || "open-notifications", title: kind === "message" ? "Open chat" : "Open KAILA" }],
  });
}

function loadAttentionBadgesForSession() {
  state.unreadNotifications = 0;
  state.unreadNotificationItems = [];
  state.unreadMessages = [];
  const saved = readJson(STORAGE.attentionBadges, {});
  const sessionId = state.session?.id;
  if (!sessionId) return;
  const userBadges = saved[sessionId] || {};
  state.unreadNotificationItems = Array.isArray(userBadges.notificationItems) ? userBadges.notificationItems : [];
  state.unreadNotificationItems = state.unreadNotificationItems.filter((item) => isStoredNotificationUnread(item));
  state.unreadNotifications = state.unreadNotificationItems.length;
  let badgesChanged = false;
  if (!shouldBadgeActivityNotifications()) {
    const beforeCount = state.unreadNotificationItems.length;
    state.unreadNotificationItems = state.unreadNotificationItems.filter((item) => item.type !== "activity");
    state.unreadNotifications = state.unreadNotificationItems.length;
    badgesChanged = beforeCount !== state.unreadNotificationItems.length;
  }
  state.unreadMessages = Array.isArray(userBadges.messages) ? userBadges.messages : [];
  const beforeMessageCount = state.unreadMessages.length;
  state.unreadMessages = state.unreadMessages.filter((message) => isStoredMessageUnread(message));
  if (beforeMessageCount !== state.unreadMessages.length) badgesChanged = true;
  if (Number(userBadges.notifications || 0) !== state.unreadNotifications) badgesChanged = true;
  if (badgesChanged) persistAttentionBadges();
}

function isStoredNotificationUnread(item = {}) {
  if (!item?.key || !item.type || !item.createdAt) return false;
  return isUnreadNotification(item.type, item.createdAt);
}

function isStoredMessageUnread(message = {}) {
  if (!message?.type || !message.id || !message.createdAt) return false;
  return isUnreadConversationMessage(message.type, message.id, message);
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
  const inboxCount = $("[data-inbox-count]");
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
  setBellCount(inboxCount, messages);
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
  state.unreadNotificationItems.forEach((item) => {
    if (item?.type && item.createdAt) markNotificationTypeReadAt(item.type, item.createdAt);
  });
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
  renderInbox();
}

function clearUnreadMessage(type, id) {
  const key = `${type}:${id}`;
  const nextMessages = state.unreadMessages.filter((item) => item.key !== key);
  if (nextMessages.length === state.unreadMessages.length) return;
  state.unreadMessages
    .filter((item) => item.key === key && item.createdAt)
    .forEach((item) => markConversationReadAt(item.type, item.id, item.createdAt));
  state.unreadMessages = nextMessages;
  persistAttentionBadges();
  renderAttentionBadges();
  renderInbox();
}

function clearUnreadMessages() {
  if (!state.unreadMessages.length) return;
  state.unreadMessages.forEach((message) => markConversationReadAt(message.type, message.id, message.createdAt));
  state.unreadMessages = [];
  persistAttentionBadges();
  renderAttentionBadges();
  renderInbox();
}

async function syncUnreadNotificationSummaries() {
  if (!state.session || state.session.role === "ops" || state.notificationSummarySyncing) return;
  state.notificationSummarySyncing = true;
  try {
    const summary = await apiFetch("/api/notification-summary", { method: "GET", silentError: true });
    state.missedCalls = Array.isArray(summary.missedCalls) ? summary.missedCalls : [];
    const serverNotificationKeys = new Set();
    if (shouldBadgeActivityNotifications()) {
      (summary.activities || []).forEach((activity) => {
        if (!isUnreadNotification("activity", activity.createdAt)) return;
        serverNotificationKeys.add(`activity:${activity.id}`);
        addUnreadNotification(notificationItemFromActivity(activity));
      });
    }
    state.missedCalls.forEach((missedCall) => {
      if (!isUnreadNotification("missedCall", missedCall.createdAt)) return;
      serverNotificationKeys.add(`missedCall:${missedCall.id}`);
      addUnreadNotification(notificationItemFromMissedCall(missedCall));
    });
    (summary.feedNotifications || []).forEach((notification) => {
      if (!isUnreadNotification("feed", notification.createdAt)) return;
      serverNotificationKeys.add(`feed:${notification.id}`);
      addUnreadNotification(notificationItemFromFeed(notification));
    });
    const beforeCount = state.unreadNotificationItems.length;
    state.unreadNotificationItems = state.unreadNotificationItems.filter((item) => serverNotificationKeys.has(item.key));
    state.unreadNotifications = state.unreadNotificationItems.length;
    if (beforeCount !== state.unreadNotificationItems.length) {
      persistAttentionBadges();
      renderAttentionBadges();
    }
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

function notificationItemFromFeed(notification = {}) {
  if (!notification.id) return null;
  return {
    type: "feed",
    id: notification.id,
    key: `feed:${notification.id}`,
    title: notification.title || "Feed update",
    detail: notification.body || notification.detail || "",
    createdAt: notification.createdAt,
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
  apiFetch("/api/notification-read", {
    method: "POST",
    body: JSON.stringify({ type, readAt }),
    silentError: true,
  }).catch(() => {});
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
    const serverUnreadKeys = new Set();
    (summary.jobMessages || []).forEach((item) => {
      const message = item.message || {};
      if (!message.id || message.senderId === state.session.id || !isUnreadConversationMessage("job", item.requestId, message)) return;
      serverUnreadKeys.add(`job:${item.requestId}`);
      addUnreadMessage({
        type: "job",
        id: item.requestId,
        title: item.title || "Job message",
        sender: chatMessageSenderName(message),
        detail: message.detail,
        createdAt: message.createdAt,
      });
    });
    (summary.directMessages || []).forEach((item) => {
      const message = item.message || {};
      const key = directConversationMessageKey(item.userId, item.requestId || "");
      if (!message.id || message.senderId === state.session.id || !isUnreadConversationMessage("direct", key, message)) return;
      serverUnreadKeys.add(`direct:${key}`);
      addUnreadMessage({
        type: "direct",
        id: key,
        userId: item.userId,
        requestId: item.requestId || "",
        title: item.title || chatMessageSenderName(message) || "Direct message",
        sender: chatMessageSenderName(message),
        detail: message.detail,
        createdAt: message.createdAt,
      });
    });
    const beforeCount = state.unreadMessages.length;
    state.unreadMessages = state.unreadMessages.filter((message) => serverUnreadKeys.has(`${message.type}:${message.id}`));
    if (beforeCount !== state.unreadMessages.length) {
      persistAttentionBadges();
      renderAttentionBadges();
      renderInbox();
    }
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
  apiFetch("/api/message-read", {
    method: "POST",
    body: JSON.stringify({ scope: type, threadId: id, readAt }),
    silentError: true,
  }).catch(() => {});
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
  const activityOpen = $("#activity-pane")?.classList.contains("active");
  route("app");
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
  // Browser limitation: this is still web/media audio, not the native
  // notification-volume channel. The accompanying system notification is the
  // browser-supported path that may use OS notification behavior.
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

function startPersistentAttention(title, detail = "", options = {}) {
  stopPersistentAttention();
  const startedAt = Date.now();
  const pulse = () => {
    playAttentionTone("urgent");
    vibrateAfterInteraction([500, 100, 500, 100, 700]);
    if (document.hidden) {
      showSystemNotification(`KAILA: ${title}`, {
        body: detail,
        tag: options.tag || "kaila-urgent",
        requireInteraction: true,
        renotify: true,
        silent: false,
        urgency: options.urgency || "urgent",
        data: options.data || { action: "open-notifications" },
        actions: options.actions || [{ action: "open-notifications", title: "Open KAILA" }],
      });
    }
    if (Date.now() - startedAt >= (options.durationMs || URGENT_ATTENTION_MS)) stopPersistentAttention();
  };
  pulse();
  state.attentionLoop = setInterval(pulse, 4200);
}

function stopPersistentAttention() {
  clearInterval(state.attentionLoop);
  state.attentionLoop = null;
  vibrateAfterInteraction(0);
}

function resumeAttentionAudio() {
  attentionTone?.resume?.().catch(() => {});
  callTone?.context?.resume?.().catch(() => {});
}

async function showSystemNotification(title, options = {}) {
  if (shouldSuppressForegroundSystemNotification(options)) return;
  if (await showNativeNotification(title, options)) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const actions = Array.isArray(options.actions) ? options.actions : [];
  const payload = {
    body: options.body || "",
    icon: "assets/android-chrome-192x192.png",
    badge: "assets/android-chrome-192x192.png",
    tag: options.tag || "kaila-notification",
    renotify: Boolean(options.renotify),
    requireInteraction: Boolean(options.requireInteraction),
    silent: Boolean(options.silent),
    vibrate: options.urgency === "call" ? [450, 180, 450, 180, 700] : ["urgent", "job"].includes(options.urgency) ? [500, 100, 500, 100, 700] : [280, 90, 280],
    data: options.data || {},
    ...(actions.length ? { actions } : {}),
  };
  const simplePayload = { ...payload };
  delete simplePayload.actions;
  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      try {
        await registration.showNotification(title, payload);
      } catch {
        await registration.showNotification(title, simplePayload);
      }
      return;
    }
  } catch {}
  try {
    new Notification(title, simplePayload);
  } catch {}
}

function shouldSuppressForegroundSystemNotification(options = {}) {
  if (options.urgency === "call") return false;
  if (document.visibilityState !== "visible") return false;
  return Boolean(document.body.classList.contains("app-mode") || state.session);
}

async function showNativeNotification(title, options = {}) {
  const notifications = nativeLocalNotifications();
  if (!notifications) return false;
  if (!state.nativeNotificationsReady) await setupNativeNotifications();
  const permitted = await ensureNativeNotificationPermission();
  if (!permitted) return false;
  const urgency = options.urgency || "update";
  const isJobRequest = urgency === "job" || options.data?.action === "job-request";
  const channelId = urgency === "call"
    ? NATIVE_NOTIFICATION_CHANNELS.calls
    : isJobRequest
      ? NATIVE_NOTIFICATION_CHANNELS.jobs
      : urgency === "urgent"
      ? NATIVE_NOTIFICATION_CHANNELS.urgent
      : NATIVE_NOTIFICATION_CHANNELS.updates;
  const action = options.data?.action || (urgency === "call" ? "open-call" : "open-notifications");
  try {
    await notifications.schedule({
      notifications: [{
        id: nativeNotificationId(options.tag || `${title}:${Date.now()}`),
        title,
        body: options.body || "",
        largeBody: options.body || "",
        summaryText: "KAILA",
        channelId,
        actionTypeId: urgency === "call" ? "kaila-call" : isJobRequest ? "kaila-job-request" : "kaila-open",
        extra: { ...(options.data || {}), action },
        smallIcon: "kaila_notification_icon",
        iconColor: "#0B4552",
        sound: urgency === "call" ? "kaila_call.wav" : isJobRequest ? "kaila_job_alert.wav" : "kaila_notification.wav",
        ongoing: urgency === "call",
        autoCancel: urgency !== "call",
        group: urgency === "call" ? "kaila-calls" : isJobRequest ? "kaila-job-requests" : "kaila-alerts",
        interruptionLevel: urgency === "call" || urgency === "urgent" || isJobRequest ? "timeSensitive" : "active",
      }],
    });
    return true;
  } catch (error) {
    console.warn("KAILA native notification failed:", error);
    return false;
  }
}

async function showNativeIncomingCall(senderName, callType = "audio") {
  const nativeBridge = nativeKailaBridge();
  if (!nativeBridge?.showIncomingCall) return false;
  const permitted = await ensureNativeNotificationPermission();
  if (!permitted) return false;
  try {
    const result = await nativeBridge.showIncomingCall({
      callerName: senderName || "Your job contact",
      callType,
      callId: state.call?.callId || "",
    });
    return Boolean(result?.shown);
  } catch (error) {
    console.warn("KAILA native incoming call notification failed:", error);
    return false;
  }
}

function nativeNotificationId(value) {
  const text = String(value || Date.now());
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) || Math.floor(Date.now() % 2147483647);
}

async function requestCallWakeLock() {
  if (!state.call || callWakeLock || document.visibilityState !== "visible") return;
  // Browser limitation: Screen Wake Lock can keep an already-visible PWA awake,
  // but it cannot wake a locked phone, bypass Do Not Disturb, or keep JavaScript
  // running after the browser suspends the page. True lock-screen ringing needs
  // native app call APIs or Web Push delivered by the browser/OS.
  try {
    callWakeLock = await navigator.wakeLock?.request?.("screen");
    callWakeLock?.addEventListener?.("release", () => {
      callWakeLock = null;
      if (state.call && document.visibilityState === "visible") setTimeout(requestCallWakeLock, 1000);
    });
  } catch {
    callWakeLock = null;
  }
}

function releaseCallWakeLock() {
  const lock = callWakeLock;
  callWakeLock = null;
  lock?.release?.().catch(() => {});
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
  if (isNativeAppOrigin()) return NATIVE_SOCKET_URL;
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname || "localhost";
  return window.location.protocol === "https:" ? `${protocol}//${host}/kaila-api` : `${protocol}//${host}:6002`;
}

function isNativeAppOrigin() {
  if (["capacitor:", "ionic:"].includes(window.location.protocol)) return true;
  if (window.location.protocol === "https:" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) && /\bwv\b/i.test(navigator.userAgent || "")) return true;
  if (!window.Capacitor) return false;
  if (typeof window.Capacitor.isNativePlatform === "function") return window.Capacitor.isNativePlatform();
  if (typeof window.Capacitor.getPlatform === "function") return ["android", "ios"].includes(window.Capacitor.getPlatform());
  return true;
}

function normalizeSocketUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname === PRODUCTION_HOST) return NATIVE_SOCKET_URL;
    if (isNativeAppOrigin() && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return "";
    const localHosts = ["localhost", "127.0.0.1", "::1"];
    const isLocalPage = localHosts.includes(window.location.hostname);
    if (localHosts.includes(url.hostname) && !isLocalPage) return "";
    if ((window.location.protocol === "https:" || isNativeAppOrigin()) && url.protocol !== "https:") return "";
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
  return canActAsProvider() && request.clientId !== state.session?.id && providerMatchesRequest(request) && ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function hasClientPrice(request) {
  return Boolean(request.budget && request.budget.trim().toLowerCase() !== "open");
}

function canAcceptClientPrice(request) {
  return canActAsProvider() && hasClientPrice(request) && canOffer(request);
}

function canPass(request) {
  return canActAsProvider() && request.clientId !== state.session?.id && providerMatchesRequest(request) && ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function isVisibleToProvider(request) {
  if (request.acceptedProviderId === state.session.id) return true;
  if (request.passedProviderIds?.includes(state.session.id)) return false;
  if (!providerMatchesRequest(request)) return false;
  return ["Posted", "Offers Received", "Countered"].includes(request.status);
}

function normalizeAreaCity(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function cityFromArea(area = "") {
  const parts = String(area || "").split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";
  const knownCity = parts.find((part) => (state.geography.cities || []).includes(part));
  if (knownCity) return knownCity;
  if (parts.length < 2) return "";
  return parts[parts.length - 2] || "";
}

function sameCityArea(leftArea = "", rightArea = "") {
  const leftCity = normalizeAreaCity(cityFromArea(leftArea));
  const rightCity = normalizeAreaCity(cityFromArea(rightArea));
  return Boolean(leftCity && rightCity && leftCity === rightCity);
}

function providerMatchesRequest(request) {
  const provider = state.providers.find((item) => item.userId === state.session?.id);
  return Boolean(provider && categoryList(provider.category).includes(request.category) && sameCityArea(provider.area, request.area));
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
    clearJobRequestNotification(requestId);
    const payload = await apiFetch(`/api/requests/${requestId}/pass`, { method: "POST", body: "{}" });
    applyServerState(payload.state);
    notify("Request passed", "", "success");
  } catch (error) {
    notify("Pass failed", error.message, "error");
  }
}

function clearJobRequestNotification(requestId = "") {
  if (!requestId) return;
  stopPersistentAttention();
  nativeKailaBridge()?.cancelJobNotification?.({ requestId, id: requestId }).catch(() => {});
  clearNativeJobRequestNotification(requestId);
}

function clearVisibleProviderJobNotifications() {
  if (!canActAsProvider()) return;
  state.requests
    .filter((request) => ["Posted", "Offers Received", "Countered"].includes(request.status) && providerMatchesRequest(request))
    .forEach((request) => clearJobRequestNotification(request.id));
}

function canSelectOffer(request) {
  return request.clientId === state.session?.id && visibleOffers(request).length > 0 && ["Offers Received", "Countered"].includes(request.status);
}

function canEditRequest(request = {}) {
  return Boolean(request.clientId === state.session?.id && ["Posted", "Offers Received", "Countered"].includes(request.status));
}

function visibleOffers(request) {
  if (!request?.offers?.length) return [];
  const passedProviderIds = new Set(request.passedProviderIds || []);
  return request.offers.filter((offer) => !passedProviderIds.has(offer.providerId));
}

function providerOwnOfferForRequest(request = {}) {
  if (!canActAsProvider() || !request?.offers?.length) return null;
  return visibleOffers(request).find((offer) => offer.providerId === state.session.id) || null;
}

function providerRouteOriginForRequest(request = {}) {
  if (!canActAsProvider()) return null;
  return normalizeLocation(state.deviceLocation) || normalizeLocation(providerOwnOfferForRequest(request)?.providerLocation);
}

function routeDistanceKey(from, to) {
  return [from, to].map((point) => {
    const clean = normalizeLocation(point);
    return clean ? `${clean.lat.toFixed(5)},${clean.lng.toFixed(5)}` : "";
  }).join("|");
}

function cachedRouteDistanceKm(from, to) {
  const key = routeDistanceKey(from, to);
  const cached = state.routeDistanceCache.get(key);
  if (!cached || cached.expiresAt <= Date.now() || typeof cached.value !== "number") return null;
  return cached.value;
}

async function routeDistanceKm(from, to) {
  const start = normalizeLocation(from);
  const end = normalizeLocation(to);
  if (!start || !end) return null;
  const key = routeDistanceKey(start, end);
  const cached = state.routeDistanceCache.get(key);
  if (cached?.promise) return cached.promise;
  if (cached?.expiresAt > Date.now() && typeof cached.value === "number") return cached.value;
  const promise = fetchDirectRouteDistanceKm(start, end)
    .catch(() => fetchApiRouteDistanceKm(start, end))
    .then((value) => {
      const distance = Number(value);
      if (!Number.isFinite(distance)) throw new Error("Route distance unavailable");
      state.routeDistanceCache.set(key, { value: distance, expiresAt: Date.now() + ROUTE_DISTANCE_CACHE_MS });
      return distance;
    })
    .catch(() => {
      state.routeDistanceCache.delete(key);
      return null;
    });
  state.routeDistanceCache.set(key, { promise, expiresAt: Date.now() + 30000 });
  return promise;
}

async function fetchDirectRouteDistanceKm(from, to) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const base = ROUTE_DISTANCE_DIRECT_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&alternatives=false&steps=false`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.code !== "Ok" || !payload.routes?.length) throw new Error(payload.message || "Route distance unavailable");
    const value = Number(payload.routes[0].distance) / 1000;
    if (!Number.isFinite(value)) throw new Error("Route distance unavailable");
    return Math.round(value * 10) / 10;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchApiRouteDistanceKm(from, to) {
  if (!state.session?.id) return null;
  const query = new URLSearchParams({
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng,
  });
  const payload = await apiFetch(`/api/route-distance?${query.toString()}`, { method: "GET", silentError: true });
  const value = Number(payload.distanceKm);
  if (!Number.isFinite(value)) throw new Error("Route distance unavailable");
  return value;
}

async function fetchRouteGeometry(from, to) {
  const start = normalizeLocation(from);
  const end = normalizeLocation(to);
  if (!start || !end) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 11000);
  try {
    const base = ROUTE_DISTANCE_DIRECT_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&alternatives=false&steps=true&geometries=geojson`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.code !== "Ok" || !payload.routes?.length) throw new Error(payload.message || "Route unavailable");
    const route = payload.routes[0];
    const coordinates = Array.isArray(route.geometry?.coordinates)
      ? route.geometry.coordinates.map(([lng, lat]) => normalizeLocation({ lat, lng })).filter(Boolean)
      : [];
    return {
      distanceKm: Math.round((Number(route.distance) || 0) / 100) / 10,
      durationMinutes: Math.max(1, Math.round((Number(route.duration) || 0) / 60)),
      coordinates,
      steps: (route.legs || []).flatMap((leg) => leg.steps || []).slice(0, 8).map((step) => ({
        name: step.name || "",
        instruction: routeStepInstruction(step),
        distanceKm: Math.round((Number(step.distance) || 0) / 100) / 10,
      })),
    };
  } catch (error) {
    console.warn("KAILA route geometry failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function navigationRoute(from, to, nav = {}) {
  const start = normalizeLocation(from);
  const end = normalizeLocation(to);
  if (!start || !end) return null;
  const route = await fetchRouteGeometry(start, end);
  if (route?.coordinates?.length) return route;
  const fallbackDistanceKm = Number.isFinite(Number(nav.distanceMeters))
    ? Number(nav.distanceMeters) / 1000
    : distanceKm(start, end);
  if (!Number.isFinite(fallbackDistanceKm)) return null;
  return {
    distanceKm: Math.round(fallbackDistanceKm * 10) / 10,
    durationMinutes: Number.isFinite(Number(nav.etaMinutes)) ? Number(nav.etaMinutes) : Math.max(1, Math.ceil((fallbackDistanceKm / NAVIGATION_SPEED_KMH) * 60)),
    coordinates: [start, end],
    steps: [{ instruction: "Approximate direct route to job site", distanceKm: Math.round(fallbackDistanceKm * 10) / 10 }],
    source: "estimate",
  };
}

function routeStepInstruction(step = {}) {
  const modifier = String(step.maneuver?.modifier || "").replace(/_/g, " ");
  const type = String(step.maneuver?.type || "").replace(/_/g, " ");
  const road = step.name ? ` onto ${step.name}` : "";
  if (type === "depart") return `Start${road}`;
  if (type === "arrive") return "Arrive at destination";
  if (type === "turn" && modifier) return `Turn ${modifier}${road}`;
  if (type === "new name") return `Continue${road}`;
  if (type === "roundabout") return `Enter roundabout${road}`;
  if (type) return `${capitalize(type)}${modifier ? ` ${modifier}` : ""}${road}`;
  return road ? `Continue${road}` : "Continue";
}

async function openNavigationModal({ request = {}, target = {}, origin = null } = {}) {
  const session = ensureNavigationSession({ request, target, origin });
  if (!session) return;
  session.minimized = false;
  session.modalShouldMinimize = false;
  removeNavigationPip();
  await modal({
    width: "min(96vw, 960px)",
    customClass: { popup: "kaila-popup navigation-popup" },
    title: "",
    html: `
      <div class="navigation-shell">
        <div class="navigation-head">
          <div>
            <h3>${escapeHtml(session.label)}</h3>
            <p>${escapeHtml(request.category || "KAILA route")}${session.detail ? ` - ${escapeHtml(session.detail)}` : ""}</p>
          </div>
          <div class="navigation-head-actions">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-navigation-minimize><i class="fa-solid fa-down-left-and-up-right-to-center"></i> Minimize</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-navigation-external><i class="fa-solid fa-up-right-from-square"></i> Maps</button>
          </div>
        </div>
        <div class="navigation-map-wrap">
          <div class="navigation-map" data-navigation-map></div>
          <div class="k-map-zoom navigation-zoom" aria-label="Map zoom controls">
            <button type="button" data-navigation-zoom-in aria-label="Zoom in"><i class="fa-solid fa-plus"></i></button>
            <button type="button" data-navigation-zoom-out aria-label="Zoom out"><i class="fa-solid fa-minus"></i></button>
            <button type="button" data-navigation-recenter aria-label="Recenter map"><i class="fa-solid fa-crosshairs"></i></button>
          </div>
        </div>
        <div class="navigation-panel">
          <div class="navigation-status-row">
            <span class="navigation-status-chip ${escapeAttribute(navigationStatusClass(navigationDisplayState(session)))}" data-navigation-status>${escapeHtml(navigationStatusText(navigationDisplayState(session)))}</span>
            <small data-navigation-updated>${escapeHtml(navigationUpdatedText(session))}</small>
          </div>
          <div class="navigation-stats" data-navigation-stats>
            <span><i class="fa-solid fa-location-dot"></i> Destination pinned</span>
            <span>${session.providerLocation ? "Building route..." : session.mode === "provider" ? "Start travel to share live ETA." : "Waiting for provider travel."}</span>
          </div>
          <div class="navigation-actions" data-navigation-actions></div>
          <div class="navigation-steps" data-navigation-steps></div>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => bindNavigationMap(session),
    willClose: () => {
      session.modalOpen = false;
      session.modalRender = null;
      if (session.modalShouldMinimize) {
        session.minimized = true;
        renderNavigationPip(session);
        return;
      }
      stopNavigationWatch({ clearSession: true });
    },
  });
}

function bindNavigationMap(session) {
  const popup = window.Swal.getPopup?.() || document;
  const mapEl = $("[data-navigation-map]", popup);
  const stats = $("[data-navigation-stats]", popup);
  const steps = $("[data-navigation-steps]", popup);
  const statusChip = $("[data-navigation-status]", popup);
  const updated = $("[data-navigation-updated]", popup);
  const actions = $("[data-navigation-actions]", popup);
  const destinationLocation = normalizeLocation(session?.destination);
  session.modalOpen = true;
  let map = null;
  let providerMarker = null;
  let routeLine = null;

  const setStats = (route = null) => {
    if (!stats) return;
    const nav = session.navigationState || {};
    stats.innerHTML = route
      ? `<span><i class="fa-solid fa-route"></i> ${escapeHtml(formatDistanceKm(route.distanceKm))}</span><span><i class="fa-solid fa-clock"></i> About ${escapeHtml(route.durationMinutes)} min</span>`
      : nav.distanceMeters
        ? `<span><i class="fa-solid fa-route"></i> ${escapeHtml(formatNavigationDistance(nav))}</span><span><i class="fa-solid fa-clock"></i> ${escapeHtml(nav.etaMinutes || "?")} min ETA</span>`
        : `<span><i class="fa-solid fa-location-dot"></i> Destination pinned</span><span>${session.providerLocation ? "Route estimate unavailable" : session.mode === "provider" ? "Start travel to share live ETA" : "Waiting for provider location"}</span>`;
  };
  const setStatus = () => {
    const nav = navigationDisplayState(session);
    if (statusChip) {
      statusChip.className = `navigation-status-chip ${navigationStatusClass(nav)}`;
      statusChip.textContent = navigationStatusText(nav);
    }
    if (updated) updated.textContent = navigationUpdatedText(session, session.lastRoute);
  };
  const bindActionButtons = () => {
    $("[data-navigation-current]", actions)?.addEventListener("click", async () => {
      session.localNavigationPhase = "requesting_permission";
      setStatus();
      const location = await getDeviceLocation({ maximumAge: 15000, timeout: 12000 });
      session.localNavigationPhase = "";
      if (!location) {
        setStatus();
        return;
      }
      session.currentOrigin = location;
      session.providerLocation = location;
      renderRoute();
      session.pipRender?.();
    });
    $("[data-navigation-start]", actions)?.addEventListener("click", () => {
      navigationDebug("Start Travel button click fired", { requestId: session.request?.id, phase: navigationPhase(session) });
      startProviderTravel(session);
    });
    $("[data-navigation-track]", actions)?.addEventListener("click", () => startNavigationWatch(session));
    $("[data-navigation-reload]", actions)?.addEventListener("click", () => refreshNavigationState(session.request.id));
    $("[data-navigation-close]", actions)?.addEventListener("click", () => window.Swal.close());
    $("[data-navigation-stop]", actions)?.addEventListener("click", () => stopProviderTravel(session));
  };
  const renderActions = () => {
    if (!actions) return;
    const phase = navigationPhase(session);
    const active = isNavigationActive(session.navigationState || {});
    if (session.mode === "provider") {
      const starting = ["waiting_to_start", "requesting_permission", "waiting_gps_permission", "waiting_gps_signal", "starting"].includes(phase);
      actions.innerHTML = `
        ${active ? "" : `<button class="btn btn-sm btn-primary" type="button" data-navigation-start ${starting ? "disabled" : ""}><i class="fa-solid ${starting ? "fa-spinner fa-spin" : "fa-location-arrow"}"></i> ${starting ? "Starting..." : "Start Travel"}</button>`}
        <button class="btn btn-sm btn-outline-primary" type="button" data-navigation-current ${starting ? "disabled" : ""}><i class="fa-solid fa-location-crosshairs"></i> Use My Location</button>
        ${active ? `<button class="btn btn-sm btn-outline-primary" type="button" data-navigation-track><i class="fa-solid fa-route"></i> Follow Me</button>` : ""}
        ${active ? `<button class="btn btn-sm btn-outline-secondary" type="button" data-navigation-stop><i class="fa-solid fa-pause"></i> Stop</button>` : ""}
      `;
    } else {
      actions.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" type="button" data-navigation-reload><i class="fa-solid fa-rotate"></i> Refresh</button>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-navigation-close><i class="fa-solid fa-xmark"></i> Close</button>
      `;
    }
    bindActionButtons();
  };
  const setSteps = (route = null) => {
    if (!steps) return;
    if (!route?.steps?.length) {
      steps.innerHTML = `<p>${session.currentOrigin ? "Turn details are unavailable for this route." : "Use your location to preview the route."}</p>`;
      return;
    }
    steps.innerHTML = route.steps.map((step) => `
      <div>
        <i class="fa-solid fa-turn-up"></i>
        <span>${escapeHtml(step.instruction)}${step.distanceKm ? ` · ${escapeHtml(formatDistanceKm(step.distanceKm))}` : ""}</span>
      </div>
    `).join("");
  };
  const ensureMap = () => {
    if (!mapEl || !window.L || !destinationLocation) return null;
    if (map) return map;
    map = window.L.map(mapEl, { zoomControl: false, preferCanvas: true }).setView([destinationLocation.lat, destinationLocation.lng], 15);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    const destinationMarker = window.L.marker([destinationLocation.lat, destinationLocation.lng], {
      title: session.label,
      alt: session.label,
    }).addTo(map).bindPopup(`<strong>${escapeHtml(session.label)}</strong>${session.detail ? `<br>${escapeHtml(session.detail)}` : ""}`);
    window.L.circle([destinationLocation.lat, destinationLocation.lng], {
      radius: 35,
      color: "#ef7b45",
      fillColor: "#ef7b45",
      fillOpacity: 0.12,
      weight: 2,
    }).addTo(map);
    destinationMarker.openPopup();
    setTimeout(() => map?.invalidateSize(), 80);
    return map;
  };
  const recenterMap = () => {
    const activeMap = ensureMap();
    if (!activeMap || !destinationLocation) return;
    const providerLocation = normalizeLocation(session.providerLocation);
    if (routeLine) activeMap.fitBounds(routeLine.getBounds(), { padding: [28, 28] });
    else if (providerLocation) activeMap.fitBounds(window.L.latLngBounds([
      [providerLocation.lat, providerLocation.lng],
      [destinationLocation.lat, destinationLocation.lng],
    ]), { padding: [28, 28] });
    else activeMap.setView([destinationLocation.lat, destinationLocation.lng], 16);
  };
  const renderRoute = async () => {
    const activeMap = ensureMap();
    if (!activeMap || !destinationLocation) return;
    setStatus();
    renderActions();
    if (providerMarker) providerMarker.remove();
    if (routeLine) routeLine.remove();
    const providerLocation = normalizeLocation(session.mode === "provider" ? session.currentOrigin : session.navigationState?.providerLocation) || normalizeLocation(session.providerLocation);
    session.providerLocation = providerLocation;
    if (providerLocation) {
      providerMarker = window.L.circleMarker([providerLocation.lat, providerLocation.lng], {
        radius: session.mode === "provider" ? 8 : 9,
        color: "#0b4552",
        fillColor: session.mode === "provider" ? "#0f6b70" : "#2563eb",
        fillOpacity: 0.92,
        weight: 3,
      }).addTo(activeMap).bindPopup(session.mode === "provider" ? "You" : "Provider");
      const route = await navigationRoute(providerLocation, destinationLocation, session.navigationState);
      session.lastRoute = route;
      if (route?.coordinates?.length) {
        routeLine = window.L.polyline(route.coordinates.map((point) => [point.lat, point.lng]), {
          color: "#0f6b70",
          weight: 6,
          opacity: 0.86,
        }).addTo(activeMap);
        activeMap.fitBounds(routeLine.getBounds(), { padding: [28, 28] });
        setStats(route);
        setSteps(route);
        if (updated) updated.textContent = navigationUpdatedText(session, route);
        return;
      }
    }
    if (providerLocation) recenterMap();
    else activeMap.setView([destinationLocation.lat, destinationLocation.lng], Math.max(activeMap.getZoom(), 15));
    setStats(null);
    setSteps(null);
    setStatus();
  };

  session.modalRender = renderRoute;
  ensureMap();
  renderRoute();
  $("[data-navigation-zoom-in]", popup)?.addEventListener("click", () => map?.zoomIn());
  $("[data-navigation-zoom-out]", popup)?.addEventListener("click", () => map?.zoomOut());
  $("[data-navigation-recenter]", popup)?.addEventListener("click", recenterMap);
  $("[data-navigation-external]", popup)?.addEventListener("click", () => launchExternalNavigation(destinationLocation, { origin: session.currentOrigin, label: session.label }));
  $("[data-navigation-minimize]", popup)?.addEventListener("click", () => {
    session.modalShouldMinimize = true;
    window.Swal.close();
  });
  renderActions();
}

async function startNavigationWatch(session = state.navigationSession) {
  if (!session) return;
  if (state.navigationWatchId) {
    notify("Tracking already live", "KAILA is still updating this route.", "info");
    return;
  }
  const handlePosition = (position) => {
    const location = normalizeLocation({ lat: position?.coords?.latitude, lng: position?.coords?.longitude });
    navigationDebug("navigation watch coordinate returned", {
      source: state.navigationWatchSource || "unknown",
      ok: Boolean(location),
      accuracy: position?.coords?.accuracy,
      lat: location?.lat,
      lng: location?.lng,
    });
    if (location) {
      state.deviceLocation = location;
      state.deviceLocationCheckedAt = Date.now();
      session.currentOrigin = location;
      session.providerLocation = location;
      if (session.mode === "provider") sendProviderNavigationLocation(session, position.coords);
      session.modalRender?.();
      session.pipRender?.();
    }
  };
  const handleError = (error) => {
    const denied = error?.code === error?.PERMISSION_DENIED || error?.code === 1 || /denied|permission/i.test(error?.message || "");
    state.navigationLocationStatus = denied ? "permission_denied" : "signal_unavailable";
    state.navigationLocationError = error?.message || "Location watch failed";
    navigationDebug("navigation watch failed", { source: state.navigationWatchSource || "unknown", code: error?.code, message: error?.message, denied });
    notify(denied ? "GPS permission denied" : "Tracking paused", denied ? "Use Open Maps for turn-by-turn navigation, or enable location permission in your device settings." : "KAILA could not refresh your location. You can still open Google Maps.", "warning");
  };
  if (!navigator.geolocation) {
    navigationDebug("navigation watch unavailable");
    notify("Tracking unavailable", "This device or browser does not expose GPS location.", "warning");
    return;
  }
  navigationDebug("navigator.geolocation.watchPosition start", { highAccuracy: true, timeout: 15000, maximumAge: 8000 });
  state.navigationWatchSource = "browser";
  state.navigationWatchId = navigator.geolocation.watchPosition(
    handlePosition,
    handleError,
    { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
  );
  notify("Tracking started", "KAILA will update the route until you stop navigation.", "success");
}

function stopNavigationWatch({ clearSession = false } = {}) {
  if (state.navigationWatchId && navigator.geolocation) navigator.geolocation.clearWatch(state.navigationWatchId);
  state.navigationWatchId = null;
  state.navigationWatchSource = "";
  state.navigationLastSentAt = 0;
  state.navigationLastSentLocation = null;
  if (clearSession) {
    removeNavigationPip();
    state.navigationSession = null;
  }
}

async function startProviderTravel(session = state.navigationSession) {
  if (!session?.request?.id || session.mode !== "provider") return;
  if (isNavigationActive(session.navigationState || {})) return;
  const location = normalizeLocation(state.deviceLocation) || normalizeLocation(session.currentOrigin) || normalizeLocation(session.providerLocation);
  navigationDebug("Start Travel activation path entered", { requestId: session.request.id, hasLocation: Boolean(location) });
  activateProviderTravelLocally(session, location);
  session.modalRender?.();
  session.pipRender?.();
  persistProviderTravelStart(session, location);
  startNavigationWatch(session);
  notify("Travel started", "Status is On the way. KAILA will share live location when GPS is available.", "success");
}

function activateProviderTravelLocally(session, location = null) {
  const now = new Date().toISOString();
  const providerLocation = normalizeLocation(location);
  const navigationState = {
    ...(session.navigationState || {}),
    status: "on_the_way",
    arrivalState: (session.navigationState?.arrivalState === "nearby" || session.navigationState?.arrivalState === "arrived") ? session.navigationState.arrivalState : "on_the_way",
    startedAt: session.navigationState?.startedAt || now,
    updatedAt: now,
    ...(providerLocation ? { providerLocation, lastLocationAt: now } : {}),
  };
  session.localNavigationPhase = "";
  if (providerLocation) {
    session.currentOrigin = providerLocation;
    session.providerLocation = providerLocation;
  }
  handleNavigationStateUpdate({ requestId: session.request.id, navigationState });
}

function persistProviderTravelStart(session, location = null) {
  emitNavigationBestEffort("kaila.navigation.start", {
    requestId: session.request.id,
    location: navigationLocationPayload(location),
  }, session);
}

function emitNavigationBestEffort(event, payload = {}, session = state.navigationSession) {
  if (!state.socket?.connected) {
    connectSocket();
    navigationDebug(`${event} deferred; socket offline`, { requestId: payload.requestId });
    return;
  }
  navigationDebug(`${event} emit best-effort`, { requestId: payload.requestId, hasLocation: Boolean(payload.location) });
  state.socket.emit(event, payload, (response = {}) => {
    if (response?.ok && response.navigationState) {
      handleNavigationStateUpdate({ requestId: payload.requestId || session?.request?.id, navigationState: response.navigationState });
      return;
    }
    if (response?.error) navigationDebug(`${event} persistence failed`, { requestId: payload.requestId, message: response.error });
  });
}

function navigationLocationPayload(location = {}, coords = {}) {
  const clean = normalizeLocation(location);
  if (!clean) return null;
  return {
    ...clean,
    accuracyMeters: Number.isFinite(Number(coords.accuracy ?? location.accuracyMeters)) ? Number(coords.accuracy ?? location.accuracyMeters) : null,
    heading: Number.isFinite(Number(coords.heading ?? location.heading)) ? Number(coords.heading ?? location.heading) : null,
    speedMps: Number.isFinite(Number(coords.speed ?? location.speedMps)) ? Number(coords.speed ?? location.speedMps) : null,
  };
}

function shouldSendNavigationLocation(location) {
  const clean = normalizeLocation(location);
  if (!clean) return false;
  const elapsed = Date.now() - Number(state.navigationLastSentAt || 0);
  const movedKm = state.navigationLastSentLocation ? distanceKm(state.navigationLastSentLocation, clean) : Infinity;
  return elapsed >= NAVIGATION_SEND_INTERVAL_MS || !Number.isFinite(movedKm) || movedKm * 1000 >= NAVIGATION_MIN_MOVE_METERS;
}

async function sendProviderNavigationLocation(session = state.navigationSession, coords = {}) {
  if (!session?.request?.id || session.mode !== "provider" || !shouldSendNavigationLocation(session.currentOrigin)) return;
  state.navigationLastSentAt = Date.now();
  state.navigationLastSentLocation = normalizeLocation(session.currentOrigin);
  emitNavigationBestEffort("kaila.navigation.location", {
    requestId: session.request.id,
    location: navigationLocationPayload(session.currentOrigin, coords),
  }, session);
}

async function stopProviderTravel(session = state.navigationSession) {
  if (!session?.request?.id) return;
  if (session.mode !== "provider" && state.session?.role !== "admin") {
    stopNavigationWatch({ clearSession: true });
    window.Swal.close();
    return;
  }
  stopNavigationWatch();
  handleNavigationStateUpdate({
    requestId: session.request.id,
    navigationState: {
      ...(session.navigationState || {}),
      status: "stopped",
      arrivalState: "stopped",
      updatedAt: new Date().toISOString(),
    },
  });
  emitNavigationBestEffort("kaila.navigation.stop", { requestId: session.request.id }, session);
  notify("Tracking stopped", "Live provider location sharing has stopped.", "info");
}

async function refreshNavigationState(requestId) {
  if (!requestId) return;
  try {
    const response = await apiFetch(`/api/navigation/${encodeURIComponent(requestId)}`, { method: "GET" });
    handleNavigationStateUpdate(response);
  } catch (error) {
    notify("Tracking refresh failed", error.message, "warning");
  }
}

function renderNavigationPip(session = state.navigationSession) {
  if (!session?.minimized) return;
  removeNavigationPip();
  const pip = document.createElement("section");
  pip.className = "navigation-pip";
  pip.dataset.navigationPip = "";
  pip.innerHTML = `
    <div class="navigation-pip-map-button" role="button" tabindex="0" data-navigation-pip-restore aria-label="Restore navigation map">
      <span class="navigation-pip-map" data-navigation-pip-map></span>
    </div>
    <div class="navigation-pip-body">
      <div>
        <strong>${escapeHtml(session.label)}</strong>
        <span data-navigation-pip-status>${escapeHtml(navigationStatusText(session.navigationState || {}))}</span>
      </div>
      <div class="navigation-pip-actions">
        <button type="button" data-navigation-pip-restore aria-label="Restore navigation"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>
        <button type="button" data-navigation-pip-stop aria-label="Stop navigation"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(pip);
  makeNavigationPipDraggable(pip);
  bindNavigationPip(session, pip);
}

function bindNavigationPip(session, pip) {
  const mapHost = $("[data-navigation-pip-map]", pip);
  const status = $("[data-navigation-pip-status]", pip);
  const destinationLocation = normalizeLocation(session.destination);
  let map = null;
  let originMarker = null;
  let routeLine = null;

  const ensureMap = () => {
    if (!mapHost || !window.L || !destinationLocation) return null;
    if (map) return map;
    map = window.L.map(mapHost, {
      attributionControl: false,
      dragging: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      zoomControl: false,
      preferCanvas: true,
    }).setView([destinationLocation.lat, destinationLocation.lng], 15);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20 }).addTo(map);
    window.L.marker([destinationLocation.lat, destinationLocation.lng]).addTo(map);
    setTimeout(() => map?.invalidateSize(), 80);
    return map;
  };

  const renderRoute = async () => {
    const activeMap = ensureMap();
    if (!activeMap || !destinationLocation) return;
    if (originMarker) originMarker.remove();
    if (routeLine) routeLine.remove();
    status.textContent = state.navigationWatchId ? "Tracking live" : navigationStatusText(session.navigationState || {});
    const providerLocation = normalizeLocation(session.mode === "provider" ? session.currentOrigin : session.navigationState?.providerLocation) || normalizeLocation(session.providerLocation);
    if (providerLocation) {
      originMarker = window.L.circleMarker([providerLocation.lat, providerLocation.lng], {
        radius: 6,
        color: "#0b4552",
        fillColor: "#8fe7ef",
        fillOpacity: 0.95,
        weight: 2,
      }).addTo(activeMap);
      const route = session.lastRoute?.coordinates?.length ? session.lastRoute : await navigationRoute(providerLocation, destinationLocation, session.navigationState);
      session.lastRoute = route;
      if (route?.coordinates?.length) {
        routeLine = window.L.polyline(route.coordinates.map((point) => [point.lat, point.lng]), {
          color: "#0f6b70",
          weight: 4,
          opacity: 0.9,
        }).addTo(activeMap);
        activeMap.fitBounds(routeLine.getBounds(), { padding: [12, 12], animate: false });
        status.textContent = `${formatDistanceKm(route.distanceKm)} · ${route.durationMinutes} min`;
        return;
      }
    }
    activeMap.setView([destinationLocation.lat, destinationLocation.lng], Math.max(activeMap.getZoom(), 15), { animate: false });
  };

  session.pipRender = renderRoute;
  renderRoute();
  $$("[data-navigation-pip-restore]", pip).forEach((button) => button.addEventListener("click", () => {
    session.minimized = false;
    openNavigationModal({ request: session.request, target: session.target, origin: session.currentOrigin });
  }));
  $("[data-navigation-pip-stop]", pip)?.addEventListener("click", () => {
    if (session.mode === "provider") stopProviderTravel(session);
    else stopNavigationWatch({ clearSession: true });
  });
}

function removeNavigationPip() {
  const pip = $("[data-navigation-pip]");
  if (pip) pip.remove();
  if (state.navigationSession) state.navigationSession.pipRender = null;
}

function makeNavigationPipDraggable(pip) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let moved = false;
  let suppressClick = false;

  const clampPip = (left, top) => {
    const rect = pip.getBoundingClientRect();
    const margin = 8;
    const maxLeft = window.innerWidth - rect.width - margin;
    const maxTop = window.innerHeight - rect.height - margin;
    return {
      left: Math.min(Math.max(margin, left), Math.max(margin, maxLeft)),
      top: Math.min(Math.max(margin, top), Math.max(margin, maxTop)),
    };
  };

  const movePip = (clientX, clientY) => {
    const next = clampPip(startLeft + clientX - startX, startTop + clientY - startY);
    pip.style.left = `${next.left}px`;
    pip.style.top = `${next.top}px`;
    pip.style.right = "auto";
    pip.style.bottom = "auto";
    moved = moved || Math.abs(clientX - startX) > 4 || Math.abs(clientY - startY) > 4;
  };

  pip.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-navigation-pip-stop]")) return;
    const rect = pip.getBoundingClientRect();
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    pip.classList.add("dragging");
    pip.setPointerCapture?.(event.pointerId);
  });

  pip.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    event.preventDefault();
    movePip(event.clientX, event.clientY);
  });

  const stopDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    pip.classList.remove("dragging");
    pip.releasePointerCapture?.(event.pointerId);
    if (moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  pip.addEventListener("pointerup", stopDrag);
  pip.addEventListener("pointercancel", stopDrag);
  pip.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  window.addEventListener("resize", () => {
    const rect = pip.getBoundingClientRect();
    const next = clampPip(rect.left, rect.top);
    pip.style.left = `${next.left}px`;
    pip.style.top = `${next.top}px`;
    pip.style.right = "auto";
    pip.style.bottom = "auto";
  }, { passive: true });
}

function launchExternalNavigation(destination, { origin = null, label = "" } = {}) {
  const end = normalizeLocation(destination);
  if (!end) return;
  const start = normalizeLocation(origin);
  const query = new URLSearchParams({
    api: "1",
    destination: `${end.lat},${end.lng}`,
    travelmode: "driving",
  });
  if (start) query.set("origin", `${start.lat},${start.lng}`);
  window.open(`https://www.google.com/maps/dir/?${query.toString()}`, "_blank", "noopener");
}

function hydrateOfferRouteDistances(host = document) {
  $$("[data-route-distance]", host).forEach((element) => {
    const [requestId, offerId] = String(element.dataset.routeDistance || "").split(":");
    const request = state.requests.find((item) => item.id === requestId);
    const offer = visibleOffers(request).find((item) => item.id === offerId);
    if (!request?.jobLocation || !offer?.providerLocation) return;
    routeDistanceKm(request.jobLocation, offer.providerLocation).then((value) => {
      if (value === null) {
        element.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Route distance unavailable`;
        return;
      }
      element.innerHTML = `<i class="fa-solid fa-route"></i> Route ${escapeHtml(formatDistanceKm(value))} from job site`;
    });
  });
}

function hydrateRequestRouteDistances(host = document) {
  $$("[data-request-route-distance]", host).forEach((element) => {
    const request = state.requests.find((item) => item.id === element.dataset.requestRouteDistance);
    const origin = providerRouteOriginForRequest(request);
    if (!request?.jobLocation || !origin) return;
    routeDistanceKm(origin, request.jobLocation).then((value) => {
      element.innerHTML = value !== null
        ? `<i class="fa-solid fa-location-dot"></i> Job site pinned · Route ${escapeHtml(formatDistanceKm(value))} from you`
        : `<i class="fa-solid fa-location-dot"></i> Job site pinned · Route distance unavailable`;
    });
  });
  requestProviderLocationForRouteDistances(host);
}

function requestProviderLocationForRouteDistances(host = document) {
  if (!canActAsProvider() || state.deviceLocation || state.providerDistanceLocationRefreshing) return;
  const needsOrigin = $$("[data-request-route-distance]", host).some((element) => {
    const request = state.requests.find((item) => item.id === element.dataset.requestRouteDistance);
    return request?.jobLocation && !providerRouteOriginForRequest(request);
  });
  if (!needsOrigin) return;
  state.providerDistanceLocationRefreshing = true;
  getDeviceLocation({ maximumAge: 30000, timeout: 8000, silent: true })
    .then((location) => {
      if (location) hydrateRequestRouteDistances(host);
    })
    .finally(() => {
      state.providerDistanceLocationRefreshing = false;
    });
}

function canViewConversation(request) {
  if (!state.session || !request.acceptedProviderId) return false;
  if (state.session.role === "admin") return true;
  if (state.session.role === SUPPORT_ROLE) {
    return request.status === "Disputed" || (state.reports || []).some((report) => report.requestId === request.id && report.status !== "Closed");
  }
  return request.clientId === state.session.id || request.acceptedProviderId === state.session.id;
}

function canReportJob(request = {}) {
  if (!state.session || !request.id) return false;
  if (["admin", SUPPORT_ROLE].includes(state.session.role)) return true;
  if (request.clientId === state.session.id) return false;
  if (request.acceptedProviderId === state.session.id) return true;
  return canActAsProvider() && providerMatchesRequest(request);
}

async function openReportUserModal(userId) {
  const target = userProfile(userId);
  if (!canModerateUser(target)) return;
  const result = await modal({
    title: `Report ${displayUserName(target)}`,
    html: `
      <div class="swal-form">
        <label>Reason${select("report-user-reason", ["Harassment or abuse", "Scam or fraud", "Unsafe behavior", "Fake or misleading profile", "Spam", "Other"], "", "Choose reason")}</label>
        <label>Details<textarea id="report-user-details" class="form-control" rows="4" maxlength="2000" placeholder="What happened? Include job context if useful."></textarea></label>
      </div>
    `,
    confirmButtonText: "Submit Report",
    preConfirm: () => {
      const reason = $("#report-user-reason")?.value || "";
      const details = $("#report-user-details")?.value || "";
      if (!reason) {
        window.Swal.showValidationMessage("Choose a report reason.");
        return false;
      }
      return { reportedUserId: userId, reason, details };
    },
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch("/api/reports/user", { method: "POST", body: JSON.stringify(result.value) });
    safeApplyState(response.state);
    notify("Report submitted", "KAILA support can review this report.", "success");
  } catch (error) {
    notify("Report failed", error.message, "error");
  }
}

async function openReportJobModal(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!canReportJob(request)) return;
  const result = await modal({
    title: "Report Job",
    html: `
      <div class="swal-form">
        <label>Reason${select("report-job-reason", ["Unsafe or illegal request", "Harassment or abuse", "Suspicious payment or scam", "Wrong category or misleading details", "No-show or bad faith", "Other"], "", "Choose reason")}</label>
        <label>Details<textarea id="report-job-details" class="form-control" rows="4" maxlength="2000" placeholder="Tell support what needs review."></textarea></label>
      </div>
    `,
    confirmButtonText: "Submit Report",
    preConfirm: () => {
      const reason = $("#report-job-reason")?.value || "";
      const details = $("#report-job-details")?.value || "";
      if (!reason) {
        window.Swal.showValidationMessage("Choose a report reason.");
        return false;
      }
      return { requestId, reason, details };
    },
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch("/api/reports/job", { method: "POST", body: JSON.stringify(result.value) });
    safeApplyState(response.state);
    notify("Job reported", "KAILA support can review this job.", "success");
  } catch (error) {
    notify("Report failed", error.message, "error");
  }
}

async function blockUser(userId) {
  const target = userProfile(userId);
  if (!canModerateUser(target)) return;
  const result = await modal({
    title: `Block ${displayUserName(target)}?`,
    text: "Direct messages and calls with this user will be disabled for you.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Block User",
  });
  if (!result.isConfirmed) return;
  try {
    const response = await apiFetch(`/api/blocks/${encodeURIComponent(userId)}`, { method: "POST", body: "{}" });
    safeApplyState(response.state);
    notify("User blocked", "You can unblock them from Settings.", "success");
  } catch (error) {
    notify("Block failed", error.message, "error");
  }
}

async function unblockUser(userId) {
  try {
    const response = await apiFetch(`/api/blocks/${encodeURIComponent(userId)}`, { method: "DELETE" });
    safeApplyState(response.state);
    notify("User unblocked", "", "success");
  } catch (error) {
    notify("Unblock failed", error.message, "error");
  }
}

function jobActionButtons(request) {
  if (!state.session) return "";
  const buttons = [];
  const isClient = request.clientId === state.session.id;
  const isProvider = request.acceptedProviderId === state.session.id;
  const isSupport = state.session.role === SUPPORT_ROLE;
  const icons = {
    start: "fa-play",
    provider_complete: "fa-circle-check",
    client_complete: "fa-shield-halved",
    request_revision: "fa-rotate-left",
    rate: "fa-star",
    cancel: "fa-ban",
    dispute: "fa-triangle-exclamation",
    support_resume_job: "fa-play",
    support_request_revision: "fa-rotate-left",
    support_release_payment: "fa-peso-sign",
    support_cancel_request: "fa-ban",
    resolve_dispute: "fa-handshake",
  };
  const add = (action, label, style = "outline-secondary") => {
    buttons.push(`<button class="btn btn-sm btn-${style}" data-request-id="${request.id}" data-job-action="${action}"><i class="fa-solid ${icons[action] || "fa-circle-dot"}"></i> ${label}</button>`);
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
  return `<article class="k-card empty-state"><i class="fa-solid fa-inbox"></i><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></article>`;
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
    bulkActions: true,
  });
}

function availableDaysChips(id, selected = "") {
  const selectedDays = categoryList(selected).filter((day) => AVAILABLE_DAY_OPTIONS.includes(day));
  return optionChips(id, AVAILABLE_DAY_OPTIONS, selectedDays, {
    selectedEmpty: "Select days below",
    optionsEmpty: "All days selected",
    bulkActions: true,
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
  const bulkActions = labels.bulkActions ? `
    <div class="category-chip-actions">
      <button type="button" data-chip-action="select-all">Select All</button>
      <button type="button" data-chip-action="deselect-all">Deselect All</button>
      <button type="button" data-chip-action="clear">Clear</button>
    </div>
  ` : "";
  return `
    <div class="category-chip-box" data-category-chip-box="${escapeAttribute(id)}">
      ${bulkActions}
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

function bindCategoryChips(id, scope = document) {
  const box = $(`[data-category-chip-box="${escapeCssIdentifier(id)}"]`, scope);
  if (!box) return;
  $$("[data-chip-action]", box).forEach((button) => button.addEventListener("click", () => {
    const options = chipOptionsForId(id);
    const action = button.dataset.chipAction;
    const next = action === "select-all" ? options : [];
    box.outerHTML = chipsForId(id, next);
    bindCategoryChips(id, scope);
  }));
  $$("[data-category-chip]", box).forEach((button) => button.addEventListener("click", () => {
    const selected = selectedCategoryChips(id, scope);
    const category = button.dataset.categoryChip;
    const next = selected.includes(category) ? selected.filter((item) => item !== category) : [...selected, category];
    box.outerHTML = chipsForId(id, next);
    bindCategoryChips(id, scope);
  }));
}

function selectedCategoryChips(id, scope = document) {
  const box = $(`[data-category-chip-box="${escapeCssIdentifier(id)}"]`, scope);
  if (!box) return [];
  return $$("[data-category-selected] .category-chip", box).map((button) => button.dataset.categoryChip).filter(Boolean);
}

function chipsForId(id, selected = "") {
  if (id.includes("days")) return availableDaysChips(id, selected);
  if (id.includes("coverage")) return coverageAreaChips(id, selected);
  return categoryChips(id, selected);
}

function chipOptionsForId(id) {
  if (id.includes("days")) return AVAILABLE_DAY_OPTIONS;
  if (id.includes("coverage")) return sortedBarangays(state.geography.barangays);
  return SERVICE_CATEGORIES;
}

function addressFields(id, value = "") {
  const address = parseAddress(value);
  const regions = state.geography.regions?.length ? state.geography.regions : [state.geography.region];
  const selectedRegion = regions.includes(address.region) ? address.region : (regions.includes(regionForAddress(address)) ? regionForAddress(address) : regions[0] || state.geography.region);
  const provinces = provincesForRegion(selectedRegion);
  const selectedProvince = provinces.includes(address.province) ? address.province : provinceForAddress(address, selectedRegion);
  const cities = citiesForProvince(selectedProvince);
  const selectedCity = cities.includes(address.city) ? address.city : cityForProvince(selectedProvince);
  const barangays = barangaysForCity(selectedCity);
  const selectedBarangay = barangays.includes(address.barangay) ? address.barangay : "";
  return `
    <div class="address-grid" data-address-group="${escapeAttribute(id)}">
      <label><span>Region</span>${select(`${id}-region`, regions, selectedRegion)}</label>
      <label><span>Province</span>${select(`${id}-province`, provinces, selectedProvince)}</label>
      <label><span>City / Municipality</span>${select(`${id}-city`, cities, selectedCity)}</label>
      <label><span>Barangay</span>${select(`${id}-barangay`, barangays, selectedBarangay, "Choose barangay")}</label>
      <label><span>Purok</span><input id="${escapeAttribute(id)}-purok" class="form-control" data-address-purok inputmode="text" maxlength="60" value="${escapeAttribute(address.purok)}" placeholder="Purok / Zone"></label>
      <label><span>House No. <small>(optional)</small></span><input id="${escapeAttribute(id)}-house" class="form-control" data-address-house inputmode="text" maxlength="60" value="${escapeAttribute(address.house)}" placeholder="House no."></label>
    </div>
  `;
}

function bindAddressGroup(id, scope = document) {
  const group = $(`[data-address-group="${escapeCssIdentifier(id)}"]`, scope);
  if (!group) return;
  const region = $(`#${id}-region`, group);
  const province = $(`#${id}-province`, group);
  const city = $(`#${id}-city`, group);
  const barangay = $(`#${id}-barangay`, group);
  region?.addEventListener("change", () => {
    if (!province || !city || !barangay) return;
    const provinces = provincesForRegion(region.value);
    province.innerHTML = provinces.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("");
    province.value = provinces[0] || "";
    const cities = citiesForProvince(province.value);
    city.innerHTML = cities.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("");
    city.value = cities[0] || "";
    barangay.innerHTML = `<option value="">Choose barangay</option>${barangaysForCity(city.value).map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("")}`;
  });
  province?.addEventListener("change", () => {
    if (!city || !barangay) return;
    const cities = citiesForProvince(province.value);
    city.innerHTML = cities.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("");
    city.value = cities[0] || "";
    barangay.innerHTML = `<option value="">Choose barangay</option>${barangaysForCity(city.value).map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("")}`;
  });
  city?.addEventListener("change", () => {
    if (province) province.value = state.geography.cityProvinces?.[city.value] || INDEPENDENT_CITY_PROVINCE;
    if (region) region.value = state.geography.cityRegions?.[city.value] || state.geography.provinceRegions?.[province?.value] || state.geography.region;
    if (barangay) {
      barangay.innerHTML = `<option value="">Choose barangay</option>${barangaysForCity(city.value).map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join("")}`;
    }
  });
}

function regionForAddress(address = {}) {
  if (address.city && state.geography.cityRegions?.[address.city]) return state.geography.cityRegions[address.city];
  if (address.province && state.geography.provinceRegions?.[address.province]) return state.geography.provinceRegions[address.province];
  return state.geography.region;
}

function provinceForAddress(address = {}, region = state.geography.region) {
  const provinces = provincesForRegion(region);
  if (address.city && provinces.includes(state.geography.cityProvinces?.[address.city])) return state.geography.cityProvinces[address.city];
  if (address.province && provinces.includes(address.province)) return address.province;
  return provinces.includes(state.geography.province) ? state.geography.province : provinces[0] || state.geography.province || "";
}

function cityForProvince(province = "") {
  const cities = citiesForProvince(province);
  return cities.includes(state.geography.city) ? state.geography.city : cities[0] || state.geography.city;
}

function provincesForRegion(region = "") {
  const provinces = state.geography.provinces?.length ? state.geography.provinces : [state.geography.province || INDEPENDENT_CITY_PROVINCE];
  return sortedBarangays(provinces.filter((province) => (state.geography.provinceRegions?.[province] || state.geography.region) === region));
}

function citiesForProvince(province = "") {
  return sortedBarangays(state.geography.provinceCities?.[province] || state.geography.cities || [state.geography.city]);
}

function barangaysForCity(city = "") {
  return sortedBarangays(state.geography.cityBarangays?.[city] || state.geography.barangays);
}

function sortedBarangays(barangays = []) {
  return Array.from(new Set(barangays.map((item) => String(item || "").trim()).filter(Boolean)))
    .sort((left, right) => BARANGAY_COLLATOR.compare(left, right));
}

function addressValue(id, scope = document) {
  const group = $(`[data-address-group="${escapeCssIdentifier(id)}"]`, scope);
  if (!group) return "";
  const barangay = $(`#${id}-barangay`, group)?.value || "";
  if (!barangay) return "";
  const city = $(`#${id}-city`, group)?.value || state.geography.city;
  const province = $(`#${id}-province`, group)?.value || state.geography.cityProvinces?.[city] || state.geography.province || INDEPENDENT_CITY_PROVINCE;
  const purok = $("[data-address-purok]", group)?.value.trim() || "";
  const house = $("[data-address-house]", group)?.value.trim() || "";
  return [house, purok, barangay, city, province].filter(Boolean).join(", ");
}

function parseAddress(value = "") {
  const parts = String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
  const cities = state.geography.cities?.length ? state.geography.cities : [state.geography.city];
  const cityIndex = parts.findIndex((part) => cities.includes(part));
  const city = cityIndex >= 0 ? parts[cityIndex] : "";
  const afterCity = cityIndex >= 0 ? parts.slice(cityIndex + 1) : [];
  const provinces = state.geography.provinces?.length ? state.geography.provinces : [state.geography.province || INDEPENDENT_CITY_PROVINCE];
  const province = afterCity.find((part) => provinces.includes(part)) || (city ? state.geography.cityProvinces?.[city] || "" : "");
  const beforeCity = cityIndex >= 0 ? parts.slice(0, cityIndex) : parts.filter((part) => !provinces.includes(part));
  const barangayOptions = city ? barangaysForCity(city) : state.geography.barangays;
  const barangay = [...beforeCity].reverse().find((part) => barangayOptions.includes(part)) || beforeCity[beforeCity.length - 1] || "";
  const detailParts = beforeCity.filter((part) => part !== barangay);
  return {
    house: detailParts.length > 1 ? detailParts[0] : "",
    purok: detailParts.length ? detailParts[detailParts.length - 1] : "",
    barangay,
    city,
    province,
    region: regionForAddress({ city, province }),
  };
}

function notificationItemFromPushData(data = {}, notification = {}) {
  const id = data.messageId || data.requestId || data.offerId || data.callId || data.id || `${data.type || "push"}:${Date.now()}`;
  return {
    type: data.type || "push",
    id,
    key: `${data.type || "push"}:${id}`,
    title: data.title || notification.title || "KAILA update",
    detail: data.body || notification.body || "",
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

function selectedValues(selector) {
  const element = $(selector);
  return element ? Array.from(element.selectedOptions).map((option) => option.value).filter(Boolean) : [];
}

function timeRangeValue(startSelector, endSelector, scope = document) {
  const start = $(startSelector, scope)?.value || "";
  const end = $(endSelector, scope)?.value || "";
  if (!start && !end) return "";
  return [start || "Any", end || "Any"].join(" - ");
}

function parseTimeRange(value = "") {
  const [start = "", end = ""] = String(value || "").match(/\b\d{2}:\d{2}\b/g) || [];
  return { start, end };
}

function priceRangeValue(minSelector, maxSelector, scope = document) {
  const min = normalizeCurrencyInput($(minSelector, scope)?.value || "");
  const max = normalizeCurrencyInput($(maxSelector, scope)?.value || "");
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

function workspaceForm(options) {
  const {
    title = "Workspace",
    html = "",
    confirmButtonText = "Save",
    cancelButtonText = "Cancel",
    didOpen,
    preConfirm,
  } = options;
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
      closeWorkspacePanel({ silent: true });
    };
    const panel = openWorkspacePanel(`
      <section class="workspace-form">
        <header class="workspace-form-header">
          <button class="chat-icon-button" type="button" data-workspace-cancel aria-label="Close">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h2>${escapeHtml(title)}</h2>
        </header>
        <div class="workspace-form-body">${html}</div>
        <div class="workspace-validation" data-workspace-validation hidden></div>
        <footer class="workspace-form-actions">
          <button class="btn btn-outline-secondary" type="button" data-workspace-cancel>${escapeHtml(cancelButtonText)}</button>
          <button class="btn btn-primary" type="button" data-workspace-submit>${escapeHtml(confirmButtonText)}</button>
        </footer>
      </section>
    `, {
      onOpen: (workspacePanel) => {
        const validation = $("[data-workspace-validation]", workspacePanel);
        const showValidation = (message) => {
          if (!validation) return;
          validation.textContent = String(message || "Check the highlighted fields.");
          validation.hidden = false;
        };
        const submit = async () => {
          if (validation) validation.hidden = true;
          const originalShowValidation = window.Swal?.showValidationMessage;
          const hadShowValidation = Boolean(window.Swal && "showValidationMessage" in window.Swal);
          if (window.Swal) window.Swal.showValidationMessage = showValidation;
          try {
            const value = preConfirm ? await preConfirm() : true;
            if (value === false) return;
            settle({ isConfirmed: true, value });
          } catch (error) {
            showValidation(error.message || "Something went wrong.");
          } finally {
            if (window.Swal && hadShowValidation) {
              window.Swal.showValidationMessage = originalShowValidation;
            } else if (window.Swal) {
              delete window.Swal.showValidationMessage;
            }
          }
        };
        tuneFormDensity(workspacePanel);
        didOpen?.(workspacePanel);
        $$("[data-workspace-cancel]", workspacePanel).forEach((button) => button.addEventListener("click", () => settle({ isDismissed: true })));
        $("[data-workspace-submit]", workspacePanel)?.addEventListener("click", submit);
      },
      onClose: () => {
        if (!settled) {
          settled = true;
          resolve({ isDismissed: true });
        }
      },
    });
    panel?.classList.add("workspace-panel-form");
    if (!panel) settle({ isDismissed: true });
  });
}

async function successRedirect(title, text) {
  route("app");
  window.Swal.fire({
    customClass: { popup: "kaila-popup" },
    icon: "success",
    title,
    text,
    showConfirmButton: false,
    toast: true,
    position: "top",
    timer: 3500,
    timerProgressBar: true,
  });
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
  state.lastDashboardTabTarget = "#feed-pane";
  localStorage.setItem(STORAGE.session, JSON.stringify(state.session));
  loadAttentionBadgesForSession();
  registerPushToken(state.pushToken).catch((error) => console.warn("KAILA push token registration failed:", error));
  syncSocketIdentity();
  const cached = readJson(STORAGE.stateSnapshot, null);
  if (cached) applyServerState(cached, { fromCache: true });
  else {
    state.validationEntries = mergeQueuedValidationEntries([]);
    render();
  }
  syncQueuedValidationEntries();
  activateTab("#feed-pane");
  await successRedirect("Offline login", `Welcome back, ${displayUserName(state.session)}. Saved entries will sync when online.`);
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
  const timer = icon === "error" ? 5000 : icon === "warning" ? 4500 : 3500;
  const activePopup = $(".swal2-popup");
  if (activePopup && !activePopup.classList.contains("swal2-toast")) {
    showInlineToast(title, text, icon, timer);
    return;
  }
  window.Swal.fire({ toast: true, position: "top-end", icon, title, text, showConfirmButton: false, timer, timerProgressBar: true });
}

function showInlineToast(title, text = "", icon = "info", timer = 3500) {
  let stack = $("[data-inline-toast-stack]");
  if (!stack) {
    stack = document.createElement("div");
    stack.dataset.inlineToastStack = "";
    stack.className = "inline-toast-stack";
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = `inline-toast ${icon}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon === "error" ? "fa-circle-xmark" : icon === "warning" ? "fa-triangle-exclamation" : icon === "success" ? "fa-circle-check" : "fa-circle-info"}"></i>
    <div><strong>${escapeHtml(title)}</strong>${text ? `<span>${escapeHtml(text)}</span>` : ""}</div>
  `;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 180);
  }, timer);
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function readSessionJson(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; }
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

function ownProviderProfile() {
  if (!state.session?.id) return null;
  return state.providers.find((provider) => provider.userId === state.session.id && (provider.status || "Active") === "Active") || null;
}

function defaultActiveRole() {
  return ["client", "provider"].includes(state.session?.role) ? state.session.role : "";
}

function ensureActiveRole() {
  if (!state.session) {
    state.activeRole = "";
    localStorage.removeItem(STORAGE.activeRole);
    return;
  }
  const fallback = defaultActiveRole();
  if (!fallback) {
    state.activeRole = "";
    localStorage.removeItem(STORAGE.activeRole);
    return;
  }
  if (!["client", "provider"].includes(state.activeRole)) state.activeRole = fallback;
  if (state.activeRole === "provider" && !ownProviderProfile()) state.activeRole = fallback === "provider" ? "provider" : "client";
  localStorage.setItem(STORAGE.activeRole, state.activeRole);
}

function setActiveRole(role) {
  if (!["client", "provider"].includes(role) || !canUseRole(role)) return;
  state.activeRole = role;
  localStorage.setItem(STORAGE.activeRole, role);
  render();
}

function canUseRole(role) {
  if (!["client", "provider"].includes(state.session?.role)) return false;
  if (role === "client") return true;
  return Boolean(ownProviderProfile());
}

function canActAsMarketplace() {
  return ["client", "provider"].includes(state.session?.role);
}

function canActAsClient() {
  ensureActiveRole();
  return canActAsMarketplace() && state.activeRole === "client";
}

function canActAsProvider() {
  ensureActiveRole();
  return canActAsMarketplace() && state.activeRole === "provider" && Boolean(ownProviderProfile());
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

function normalizeLocation(value = {}) {
  if (!value || typeof value !== "object") return null;
  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat: Math.round(lat * 10000000) / 10000000,
    lng: Math.round(lng * 10000000) / 10000000,
  };
}

function distanceKm(from, to) {
  const start = normalizeLocation(from);
  const end = normalizeLocation(to);
  if (!start || !end) return null;
  const radiusKm = 6371;
  const latDelta = ((end.lat - start.lat) * Math.PI) / 180;
  const lngDelta = ((end.lng - start.lng) * Math.PI) / 180;
  const startLat = (start.lat * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceKm(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  if (numeric < 1) return `${Math.max(1, Math.round(numeric * 1000))} m away`;
  return `${numeric < 10 ? numeric.toFixed(1) : Math.round(numeric)} km away`;
}

async function getDeviceLocation(options = {}) {
  const settings = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    maximumAge: options.maximumAge ?? 60000,
    timeout: options.timeout ?? 10000,
  };
  const finish = (location, status = "", error = "") => {
    state.navigationLocationStatus = status;
    state.navigationLocationError = error;
    if (location) {
      state.deviceLocation = location;
      state.deviceLocationCheckedAt = Date.now();
    }
    return location;
  };
  navigationDebug("geolocation request start", {
    source: navigator.geolocation ? "browser" : "none",
    timeout: settings.timeout,
    highAccuracy: settings.enableHighAccuracy,
  });
  if (!navigator.geolocation) {
    navigationDebug("navigator.geolocation unavailable");
    if (!options.silent) notify("Location unsupported", "This device or browser does not expose GPS location.", "warning");
    return finish(null, "unavailable", "Geolocation is unavailable");
  }
  return new Promise((resolve) => {
    navigationDebug("navigator.geolocation.getCurrentPosition start", settings);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = normalizeLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        navigationDebug("navigator.geolocation coordinate returned", {
          ok: Boolean(location),
          accuracy: position.coords.accuracy,
          lat: location?.lat,
          lng: location?.lng,
        });
        resolve(finish(location, location ? "granted" : "signal_unavailable", location ? "" : "Invalid coordinates"));
      },
      (error) => {
        const denied = error?.code === error?.PERMISSION_DENIED || error?.code === 1;
        const timeout = error?.code === error?.TIMEOUT || error?.code === 3;
        const status = denied ? "permission_denied" : timeout ? "timeout" : "signal_unavailable";
        navigationDebug("navigator.geolocation rejected", { code: error?.code, message: error?.message, denied, timeout });
        if (!options.silent) {
          notify(denied ? "Location permission denied" : "Location unavailable", denied ? "Enable location permission, pick the pin manually, or open Google Maps without live origin." : "KAILA could not get a fresh GPS fix. You can pick the pin manually or try again.", "warning");
        }
        resolve(finish(null, status, error?.message || "Location unavailable"));
      },
      settings
    );
  });
}

function scrollConversationToBottom() {
  const transcript = $("[data-chat-transcript]");
  if (transcript) transcript.scrollTop = transcript.scrollHeight;
}
