const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.KAILA_EXPERIENCE_URL || "http://127.0.0.1:8000/marketing-experience.html";
const OUT_DIR = path.join(__dirname, "../marketing-screenshots/generated-experience");

const scenes = [
  "01-post-job",
  "02-provider-alerts",
  "03-offers-received",
  "04-compare-offers",
  "05-confirm-hire",
  "06-live-tracking",
  "07-in-progress",
  "08-completed-review",
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1680, height: 945 },
    deviceScaleFactor: 1,
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  for (const scene of scenes) {
    const locator = page.locator(`[data-scene="${scene}"]`);
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await locator.screenshot({
      path: path.join(OUT_DIR, `${scene}.png`),
      animations: "disabled",
    });
  }

  await browser.close();
  console.log(`Saved ${scenes.length} screenshots to ${OUT_DIR}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
