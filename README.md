# Bhagavad Gita — Multi-Language JSON Dataset & Web App

A Node.js build script that compiles all 701 verses of the Bhagavad Gita in **Sanskrit, English, Hindi, Telugu, transliteration, and word-by-word glosses** from public-domain and permissively-licensed open sources — plus a complete offline-capable study app built on the result.

## Web App

The included `index.html` provides a fully-functional Bhagavad Gita learning app with:

**Reading**
- 📖 **701 verses** across 18 chapters
- 🌐 **Four languages**: Sanskrit, English, Telugu, Hindi — all 701 verses in each
- 🔤 **IAST transliteration** and word-by-word glosses
- 🔊 **Read aloud** — the transliteration spoken with an Indian-English voice where the device has one, using the operating system's own speech, so it works offline
- 📜 **Scholarly commentary** from Swami Sivananda, Srila Prabhupada and Swami Chinmayananda, fetched on demand and cached for offline re-reading
- 🔗 **Deep links** — every verse has its own URL (`…/#2.47`), so verses can be bookmarked, shared and reached with the browser Back button

**Study**
- 🗺️ **Guided reading plans** (Beginner, 50 Essentials, Karma Yoga, 18-Day)
- 🧠 **Quiz** at three difficulty levels
- 📝 **Personal notes** per verse
- 🔖 **Bookmarks**, reading history and progress tracking
- 🔥 **Reading streaks** with milestones and a reading calendar
- 🔍 **Search** across transliteration, translations and glosses
- 📷 **Verse image cards** and 📤 **sharing** via the Web Share API
- 💾 **Export progress** as JSON

**Platform**
- ⚡ **PWA** — installable from an in-app button, works fully offline, with app shortcuts
- ♿ **Accessible** — keyboard navigable throughout, screen-reader labelled, focus-managed dialogs, per-script `lang` tagging, honours reduced-motion and forced-colours
- 📱 **Mobile-responsive** with a bottom navigation bar
- 🌙 **Dark mode** and three text sizes
- ⌨️ **Keyboard shortcuts** (`/` search, `←`/`→` verses, `?` help)

### Run the Web App

```bash
# Install dependencies (for dev server)
npm install

# Start development server
npm run dev
# → Opens at http://localhost:3000
```

### Build Dataset

```bash
node build_gita.mjs
# → writes ./data.js with all 701 verses
```

Requires **Node.js 18+** (uses native `fetch`).

The app is published with GitHub Pages from `main` via
`.github/workflows/static.yml`, and lives at
**https://chandra-79.github.io/gita-learner/**. `npm test` runs on every push.

### Verification

```bash
npm test
```

`scripts/verify.mjs` is the guard rail for the things that have broken before or
would break silently. It fails the build if:

- the corpus is not exactly 701 verses across 18 chapters;
- `data.js` contains an `export` statement — it is loaded with a plain `<script>`
  tag, so a stray `export default` turns it into a module, throws a SyntaxError
  and leaves the app completely blank (this has happened);
- the service worker lacks an `activate` handler, never calls `caches.delete`, or
  never claims open clients — any of which pins readers to a stale build forever;
- social/structured-data metadata, `robots.txt` or `sitemap.xml` go missing;
- accessibility drops below the current bar (ARIA attributes, skip link, dialog
  roles, live region, reduced-motion, focus-visible, per-script `lang` tagging);
- verse deep linking is removed.

### Offline behaviour

`sw.js` uses a strategy per resource rather than one blanket rule:

| Resource | Strategy | Why |
| --- | --- | --- |
| Page navigations | network-first, cache fallback | a deploy reaches readers immediately; an offline reader still gets the app |
| `data.js` | stale-while-revalidate | 1.3 MB — serve instantly, refresh in the background |
| Web fonts | cache-first | immutable and versioned by URL |
| Commentary (raw.githubusercontent.com) | stale-while-revalidate, separate cache | commentary you have opened once stays readable offline |
| Other same-origin files | stale-while-revalidate | fresh without blocking |

Superseded caches are deleted on `activate`. When a new version finishes
installing, the app shows a "new version is ready" notice rather than swapping
code underneath the reader.

## Output Schema

```javascript
const GITA = [
  {
    chapter: 1,
    verse: 1,
    sanskrit: "धृतराष्ट्र उवाच...",
    transliteration: "dhṛitarāśhtra uvācha...",
    translation: "Dhritarashtra said: O Sanjaya, what did my sons...",
    hindi: "धृतराष्ट्र बोले...",
    telugu: "",  // empty (no public source)
    word_by_word: [
      "dharmakṣetre: in the field of dharma",
      "kurukṣetre: in the field of Kurus",
      // ...
    ],
    tags: []  // populate manually
  },
  // ... 699 more verses
];
```

## Coverage Report (After Running)

```
============================================================
✅ Wrote data.js

Coverage Report:
  Total verses:     700
  Sanskrit:         700 / 700
  Transliteration:  700 / 700
  English:          700 / 700
  Hindi:            665 / 700  (~95%)
  Word-by-word:     700 / 700
  Telugu:           0 / 700  (no public source)
  Tags:             0 / 700  (populate manually)
============================================================
```

## Data Sources

| Field | Source | License | Notes |
|-------|--------|---------|-------|
| **Sanskrit** | [ravisiyer/gita-data](https://github.com/gita/gita) (Ravisiyer mirror) | Unlicense (public domain) | Ancient text, public domain |
| **Transliteration** | Ravisiyer | Unlicense | IAST-style romanization |
| **English Translation** | Ravisiyer (`translation.json`) | Unlicense | Multiple translators; picks first available per verse |
| **Hindi Translation** | [vedicscriptures/bhagavad-gita](https://github.com/vedicscriptures/bhagavad-gita) | Mixed (check per-file) | GitHub API fetch; best-effort (~95% coverage) |
| **Word-by-Word Glosses** | Ravisiyer | Unlicense | English definitions of Sanskrit terms |

## Hindi: How It Works

The script attempts to fetch Hindi translations from GitHub:
```
https://api.github.com/repos/vedicscriptures/bhagavad-gita/contents/chapters/{ch}.json
```

For chapters 1–18, each file contains an array of verses with:
- `verse`: verse number
- `hindi`: Hindi translation
- `english`: English translation
- `sanskrit`: Sanskrit text

**If a fetch fails** (network error, rate-limit, auth), that chapter's Hindi fields remain empty (`""`) but the script continues. This is intentional and non-fatal.

### GitHub Rate Limits

Unauthenticated GitHub API requests are limited to **60 per hour**. Since the script makes 18 requests (one per chapter), you can run it ~3–4 times per hour. If you hit the limit, either:
- Wait an hour, or
- Set a `GITHUB_TOKEN` environment variable and the script will use authenticated requests (5000/hour limit):
  ```bash
  export GITHUB_TOKEN="github_pat_..."
  node build_gita.mjs
  ```

## Telugu: Complete

All 701 verses now carry a Telugu translation, sourced from
[`prasadkuruma/BhagavadGitaTelugu`](https://github.com/prasadkuruma/BhagavadGitaTelugu)
(`chapter{N}.json` → `data.verses[].meaning`).

The notes below record why this was hard to find, and remain useful if you want to
swap in a different Telugu edition.

### Why it was difficult
- Most modern Telugu translations are copyrighted (Gita Press, ISKCON, etc.)
- Older public-domain editions exist at archive.org but would require OCR + manual correction
- The classical Telugu Gita (Andhra Mahabharatam by Tikkana/Errapragada) is public domain but a poetic adaptation, not verse-by-verse equivalent

### Options to Add Telugu:

1. **Archive.org + OCR** (100–200 hours)
   - Find pre-1928 Telugu Gita editions on archive.org
   - Run OCR (Tesseract with Telugu models)
   - Manually correct OCR errors
   - Map verses to modern numbering

2. **Commission a Translation** (100–200 hours)
   - Hire a Telugu scholar to do a professional verse-by-verse translation
   - Estimated cost: $3,000–$5,000 USD for quality work

3. **Classical Telugu Adaptation** (200+ hours)
   - Map Tikkana/Errapragada's poetic Gita to modern verse numbers
   - Verify semantic equivalence with Sanskrit
   - May not capture all nuances of the original

4. **Crowd-source** (flexible)
   - If this is a public project, post a bounty (e.g., $500–$1,000) and ask the community

### If You Find a Public Telugu Source:

1. Place the data in a JSON file or API endpoint
2. Add a `fetchTelugu()` function (template is at the bottom of `build_gita.mjs`)
3. Call it in `main()` and merge the results
4. Run `node build_gita.mjs` again

## Tags: Manual Curation

The `tags` field is left empty by design. You can populate it with thematic labels:

```javascript
tags: [
  "dharma",        // key concept discussed
  "duty",          // major theme
  "chapter-1",     // chapter reference
  "krishna",       // speaker
  "meditation",    // topic
]
```

Suggested tag categories:
- **Yoga paths**: "karma-yoga", "bhakti-yoga", "jnana-yoga", "raja-yoga"
- **Concepts**: "dharma", "karma", "moksha", "brahman", "maya"
- **Speakers**: "krishna", "arjuna", "sanjaya"
- **Emotions/States**: "doubt", "confusion", "wisdom", "devotion"
- **Topics**: "action", "renunciation", "knowledge", "meditation"

## Extending the Script

### Add Another Language

Example: Adding a Marathi translation from a hypothetical API:

```javascript
async function fetchMarathi() {
  const marathiByChapterVerse = new Map();
  for (let ch = 1; ch <= 18; ch++) {
    const data = await fetch(`https://marathi-gita-api.example/ch/${ch}`)
      .then(r => r.json())
      .catch(() => null);
    if (!data) continue;
    if (!marathiByChapterVerse.has(ch)) {
      marathiByChapterVerse.set(ch, new Map());
    }
    if (Array.isArray(data)) {
      for (const v of data) {
        if (v && v.verse != null && clean(v.marathi)) {
          marathiByChapterVerse.get(ch).set(v.verse, v.marathi);
        }
      }
    }
  }
  return marathiByChapterVerse;
}
```

Then in `main()`:
```javascript
const marathiByChapterVerse = await fetchMarathi();
```

And add to the records:
```javascript
const records = verses.map((v) => {
  // ... existing fields ...
  marathi: marathiByChapterVerse.get(ch)?.get(vn) || "",
});
```

### Use a Different English Translator

The script picks the first available English translation. To pick a specific translator (e.g., only Swami Sivananda), modify `pickEnglishTranslation()`:

```javascript
function pickEnglishTranslation(translationsByVerse, verseId) {
  const candidates = (translationsByVerse.get(verseId) || [])
    .filter(t => 
      (t.lang || "").toLowerCase() === "english" && 
      clean(t.description) &&
      (t.authorId === "sivananda" || t.author?.name?.includes("Sivananda"))
    );
  if (candidates.length === 0) return "";
  candidates.sort((a, b) => a.description.length - b.description.length);
  return clean(candidates[0].description);
}
```

## Regenerating the File

If you modify the script (e.g., add Telugu, change English translator), just run:

```bash
node build_gita.mjs
```

It will overwrite `./data.js` with updated data.

## Licenses & Attribution

**Generated file** (`data.js`) inherits the licenses of its sources:

- **Unlicense portions** (Sanskrit, transliteration, English, word-by-word):
  - Freely usable for any purpose (public domain equivalent)
  - Include the header comment in `data.js` with attribution to Ravisiyer/gita/gita

- **Hindi portions** (from vedicscriptures):
  - Check the original [vedicscriptures/bhagavad-gita](https://github.com/vedicscriptures/bhagavad-gita) repo for per-file licenses
  - Most are permissive (Apache 2.0, MIT, CC-BY) but verify before shipping

**If you're publishing `data.js` publicly:**
1. Include the header comment generated by the script (it includes source URLs)
2. Review the vedicscriptures licenses and add appropriate notices
3. Link back to the original repositories in your README

## Troubleshooting

### Script Fails to Fetch Ravisiyer Data
- Check your internet connection
- The Ravisiyer mirror might be temporarily down; try again in a few minutes
- If it persists, open an issue at [github.com/ravisiyer/gita-data](https://github.com/ravisiyer/gita-data)

### No Hindi in Output
- Network error during Vedicscriptures fetch? Check the console for error logs
- Try setting `GITHUB_TOKEN` to use authenticated requests (higher rate limit)
- Or run the script at a different time to avoid rate-limiting

### File is Too Large
- The JSON file will be ~3–4 MB uncompressed
- For web delivery, gzip it: `gzip -k data.js`
- Minify before shipping: use a tool like `esbuild` or `terser`

### Want Different Word Order?
Edit the final `records.sort()` call in `main()`:
```javascript
// Sort by verse count (ascending)
verses.sort((a, b) => a.id - b.id);
```

## Example Usage in a Web App

```javascript
import GITA from './data.js';

// Find a specific verse
const verse = GITA.find(v => v.chapter === 2 && v.verse === 47);
console.log(verse.translation);  // "Yoga is skill in action."

// Filter by chapter
const chapter3 = GITA.filter(v => v.chapter === 3);

// Search by tag
const karmaVerses = GITA.filter(v => v.tags.includes('karma'));

// Display verse
console.log(`${verse.chapter}.${verse.verse}`);
console.log(verse.sanskrit);
console.log(verse.transliteration);
console.log(verse.translation);
console.log(verse.hindi);
console.log("Word meanings:", verse.word_by_word.join(" | "));
```

## Questions?

- **Script issues**: See the header comments in `build_gita.mjs` or open an issue here
- **Data quality**: Report errors at the original repositories:
  - Ravisiyer: [github.com/ravisiyer/gita-data](https://github.com/ravisiyer/gita-data)
  - Vedicscriptures: [github.com/vedicscriptures/bhagavad-gita](https://github.com/vedicscriptures/bhagavad-gita)
  - Original: [github.com/gita/gita](https://github.com/gita/gita)

---

**Generated by:** `build_gita.mjs`  
**Last Updated:** April 2026
