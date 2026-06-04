const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "native-www");
const androidPublicDir = path.join(root, "android", "app", "src", "main", "assets", "public");

const files = [
  "index.html",
  "style.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "google3591396b72fb49f9.html",
];

const directories = ["assets"];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) continue;
  fs.copyFileSync(source, path.join(outDir, file));
}

for (const directory of directories) {
  const source = path.join(root, directory);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(outDir, directory), { recursive: true });
}

console.log(`Prepared Capacitor web bundle in ${path.relative(root, outDir)}`);

if (fs.existsSync(path.dirname(androidPublicDir))) {
  fs.rmSync(androidPublicDir, { recursive: true, force: true });
  fs.cpSync(outDir, androidPublicDir, { recursive: true });
  console.log(`Updated Android web assets in ${path.relative(root, androidPublicDir)}`);
}
