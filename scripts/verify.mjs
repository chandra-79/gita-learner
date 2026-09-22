import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const requiredAssets = [
  "index.html",
  "data.js",
  "manifest.json",
  "sw.js",
  "robots.txt",
  "sitemap.xml",
  "404.html",
  ".nojekyll",
  "screenshots/desktop.png",
  "screenshots/mobile.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/og-image.png",
];

await Promise.all(requiredAssets.map((file) => access(file, constants.R_OK)));

const [html, data, manifestText, serviceWorker, robots, sitemap] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("data.js", "utf8"),
  readFile("manifest.json", "utf8"),
  readFile("sw.js", "utf8"),
  readFile("robots.txt", "utf8"),
  readFile("sitemap.xml", "utf8"),
]);

const fail = (message) => { throw new Error(message); };

/* ── Corpus ─────────────────────────────────────────────── */
const manifest = JSON.parse(manifestText);
if (manifest.name !== "Bhagavad Gita – Learn & Explore") fail("Unexpected PWA manifest name");

const verseMatches = [...data.matchAll(/^\s*"chapter":\s*(\d+),/gm)];
const chapters = new Set(verseMatches.map((match) => Number(match[1])));
if (verseMatches.length !== 701 || chapters.size !== 18) {
  fail(`Expected 701 verses across 18 chapters; found ${verseMatches.length} across ${chapters.size}`);
}

// data.js is loaded with a plain <script> tag. An `export` statement makes the
// whole file a module, throws a SyntaxError, and leaves the app blank — this
// has happened before, so it is a hard failure here.
if (/^\s*export\s+(default|const|\{)/m.test(data)) {
  fail("data.js contains an `export` statement; it is loaded as a plain script and must not be a module");
}

for (const reference of ["data.js", "manifest.json", "sw.js"]) {
  if (!html.includes(reference)) fail(`index.html does not reference ${reference}`);
}

/* ── Offline ────────────────────────────────────────────── */
for (const asset of ["data.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"]) {
  if (!serviceWorker.includes(asset)) fail(`Service worker does not cache ${asset}`);
}
// Stale caches must be reclaimed, or readers are pinned to an old build forever.
if (!/addEventListener\(\s*['"]activate['"]/.test(serviceWorker)) fail("Service worker has no activate handler to purge old caches");
if (!serviceWorker.includes("caches.delete")) fail("Service worker never deletes superseded caches");
if (!serviceWorker.includes("clients.claim")) fail("Service worker does not claim open clients");

/* ── Discoverability ────────────────────────────────────── */
const metaChecks = [
  [/<meta\s+name="description"\s+content="[^"]{80,}"/, "a meta description of at least 80 characters"],
  [/<meta\s+property="og:title"/, "an og:title tag"],
  [/<meta\s+property="og:image"/, "an og:image tag"],
  [/<meta\s+name="twitter:card"/, "a twitter:card tag"],
  [/<link\s+rel="canonical"/, "a canonical link"],
  [/application\/ld\+json/, "JSON-LD structured data"],
];
for (const [pattern, what] of metaChecks) {
  if (!pattern.test(html)) fail(`index.html is missing ${what}`);
}

const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) fail("Could not read the JSON-LD block");
JSON.parse(ldMatch[1]);

if (!robots.includes("Sitemap:")) fail("robots.txt does not advertise the sitemap");
if (!sitemap.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) fail("sitemap.xml uses the wrong namespace");

/* ── Accessibility ──────────────────────────────────────── */
const ariaCount = (html.match(/aria-[a-z]+=/g) || []).length;
if (ariaCount < 40) fail(`Expected at least 40 ARIA attributes in index.html; found ${ariaCount}`);
const a11yChecks = [
  [/class="skip-link"/, "a skip-to-content link"],
  [/role="dialog"/, "dialog roles on modal overlays"],
  [/aria-live=/, "at least one live region"],
  [/prefers-reduced-motion/, "a prefers-reduced-motion rule"],
  [/:focus-visible/, "focus-visible styling"],
  [/lang="sa"/, "Sanskrit language tagging"],
  [/lang="te"/, "Telugu language tagging"],
  [/lang="hi"/, "Hindi language tagging"],
];
for (const [pattern, what] of a11yChecks) {
  if (!pattern.test(html)) fail(`index.html is missing ${what}`);
}

/* ── App features ───────────────────────────────────────── */
// Read-aloud was silently lost once in a large rewrite; keep it pinned.
for (const fn of ["function toggleAudio", "function stopAudio", "function pickVoice"]) {
  if (!html.includes(fn)) fail(`index.html is missing ${fn} — the read-aloud feature would be gone`);
}
if (!html.includes("SPEECH_OK")) fail("index.html no longer guards on speech support");
if (!/id="audio-\$\{ch\}-\$\{v\}"/.test(html)) fail("The Listen button is no longer rendered on the verse card");

// Installability
if (!html.includes("beforeinstallprompt")) fail("index.html no longer listens for beforeinstallprompt");
if (!html.includes('id="install-btn"')) fail("index.html is missing the install button");

// Install UI needs screenshots and shortcuts to render richly
if (!Array.isArray(manifest.screenshots) || manifest.screenshots.length < 2) {
  fail("manifest.json needs at least two screenshots for the install dialog");
}
for (const shot of manifest.screenshots) {
  if (!shot.form_factor) fail(`manifest screenshot ${shot.src} has no form_factor`);
}
if (!Array.isArray(manifest.shortcuts) || !manifest.shortcuts.length) fail("manifest.json has no app shortcuts");
if (!manifest.icons.some((i) => String(i.purpose).includes("maskable"))) fail("manifest.json has no maskable icon");

/* ── Deep linking ───────────────────────────────────────── */
for (const fn of ["function parseRoute", "function applyRoute", "function verseUrl"]) {
  if (!html.includes(fn)) fail(`index.html is missing ${fn} — verse deep links would break`);
}
if (!/addEventListener\("hashchange"/.test(html)) fail("index.html does not listen for hashchange");

console.log(
  `Verified 701 verses across 18 chapters; the PWA manifest with ` +
  `${manifest.screenshots.length} screenshots, ${manifest.shortcuts.length} shortcuts ` +
  `and a maskable icon; offline caching (install/activate/claim); ` +
  `${ariaCount} ARIA attributes; social + structured-data metadata; robots/sitemap/404; ` +
  `read-aloud; installability; and verse deep linking.`
);
