import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const requiredAssets = [
  "index.html",
  "data.js",
  "manifest.json",
  "sw.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

await Promise.all(requiredAssets.map((file) => access(file, constants.R_OK)));

const [html, data, manifestText, serviceWorker] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("data.js", "utf8"),
  readFile("manifest.json", "utf8"),
  readFile("sw.js", "utf8"),
]);

const manifest = JSON.parse(manifestText);
if (manifest.name !== "Bhagavad Gita – Learn & Explore") {
  throw new Error("Unexpected PWA manifest name");
}

const verseMatches = [...data.matchAll(/^\s*"chapter":\s*(\d+),/gm)];
const chapters = new Set(verseMatches.map((match) => Number(match[1])));
if (verseMatches.length !== 701 || chapters.size !== 18) {
  throw new Error(`Expected 701 verses across 18 chapters; found ${verseMatches.length} across ${chapters.size}`);
}

for (const reference of ["data.js", "manifest.json", "sw.js"]) {
  if (!html.includes(reference)) throw new Error(`index.html does not reference ${reference}`);
}
for (const asset of requiredAssets.slice(1)) {
  if (!serviceWorker.includes(asset) && asset !== "sw.js") {
    throw new Error(`Service worker does not cache ${asset}`);
  }
}

console.log("Verified 701 verses, 18 chapters, the PWA manifest, and offline assets.");
