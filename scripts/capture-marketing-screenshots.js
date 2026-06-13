const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.KAILA_SCREENSHOT_URL || "http://127.0.0.1:8000";
const API_URL = process.env.KAILA_SCREENSHOT_API || "http://127.0.0.1:6002";
const OUT_DIR = path.join(__dirname, "../marketing-screenshots");
const PASSWORD = "KailaDemo123!";

async function waitForApp(page) {
  await page.waitForSelector("[data-view='app'].active", { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator(".swal2-container").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function clearModal(page) {
  const close = page.locator(".swal2-container .swal2-close, .swal2-container .swal2-cancel").first();
  if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
}

async function clearWorkspacePanel(page) {
  const cancel = page.locator("[data-workspace-cancel]").first();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
    await page.waitForTimeout(300);
  }
}

async function login(page, username) {
  const logout = page.locator("[data-logout]").first();
  if (await logout.isVisible().catch(() => false)) {
    await logout.click();
    const confirm = page.locator(".swal2-confirm").first();
    if (await confirm.isVisible({ timeout: 5000 }).catch(() => false)) await confirm.click();
    await page.waitForSelector("[data-view='login'].active, [data-view='landing'].active", { timeout: 10000 }).catch(() => {});
  }
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#login-username", username);
  await page.fill("#login-password", PASSWORD);
  await page.click("[data-login-form] button[type='submit']");
  await waitForApp(page);
  await clearModal(page);
}

async function activateTab(page, selector) {
  await page.click(selector);
  await page.waitForTimeout(500);
}

async function captureViewport(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: false });
}

async function scrollCardIntoShot(page, requestId) {
  const card = page.locator(`[data-request-card="${requestId}"]`);
  await card.waitFor({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.waitForTimeout(250);
}

async function newScreenshotPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "en-PH",
  });
  await context.addInitScript((apiUrl) => {
    localStorage.setItem("kaila.deploy.socketUrl", apiUrl);
    localStorage.setItem("kaila.deploy.theme", "light");
    localStorage.removeItem("kaila.deploy.savedLogin");
    localStorage.removeItem("kaila.deploy.session");
  }, API_URL);
  return { context, page: await context.newPage() };
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let { context, page } = await newScreenshotPage(browser);

  await login(page, "maria.santos.demo");
  await activateTab(page, "[data-feed-tab]");
  await page.evaluate(() => window.scrollTo(0, 0));
  await captureViewport(page, "01-home-feed.png");

  await page.click("[data-new-request]");
  await page.waitForSelector("[data-workspace-panel]", { timeout: 10000 });
  await page.waitForTimeout(500);
  await captureViewport(page, "02-job-post-form.png");
  await page.keyboard.press("Escape").catch(() => {});
  await clearWorkspacePanel(page);
  await clearModal(page);

  await activateTab(page, "[data-requests-tab]");
  await scrollCardIntoShot(page, "demo-job-sink");
  await captureViewport(page, "03-job-offers-counteroffer.png");

  await activateTab(page, "[data-providers-tab]");
  await page.locator("text=Ronald Appliance Care").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -100));
  await page.waitForTimeout(500);
  await captureViewport(page, "05-provider-profile-ratings.png");

  await context.close();
  ({ context, page } = await newScreenshotPage(browser));
  await login(page, "jun.velasco.demo");
  await activateTab(page, "[data-requests-tab]");
  await scrollCardIntoShot(page, "demo-job-paint");
  await captureViewport(page, "04-active-job-tracking.png");

  await scrollCardIntoShot(page, "demo-job-ref");
  await page.evaluate(() => window.scrollBy(0, 520));
  await page.waitForTimeout(250);
  await captureViewport(page, "06-completed-job-rating.png");

  await context.close();
  await browser.close();
  console.log(`Saved screenshots to ${OUT_DIR}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
