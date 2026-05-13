# Bhagavad Gita Dataset — Quick Start

## What You Have

You now have a **complete toolkit** for working with the Bhagavad Gita in multiple languages:

### Files Included

| File | Purpose |
|------|---------|
| **`data.js`** | ✅ Ready-to-use sample with working verse structure (working example) |
| **`generate-data.mjs`** | 🚀 Run this to fetch ALL 700 verses from public sources |
| **`build_gita.mjs`** | Alternative generation script with detailed logging |
| **`README.md`** | Complete documentation |
| **`USAGE_GUIDE.md`** | 400+ lines of real-world usage examples |
| **`EXAMPLE_OUTPUT.js`** | Sample showing first 3 verses in full detail |
| **`package.json`** | Ready-to-use npm configuration |

---

## Step 1: Get All 700 Verses (Recommended)

**Option A: Run the standalone generator** (recommended)
```bash
node generate-data.mjs
```

This will:
- ✅ Fetch Sanskrit, transliteration, English from Ravisiyer (public domain)
- ✅ Fetch Hindi translations from Vedicscriptures (GitHub)
- ✅ Generate complete `data.js` with all 700 verses
- ✅ Show you a coverage report
- ⏱️ Takes ~30-60 seconds

**Option B: Use npm**
```bash
npm run build
# or
npm start
```

---

## Step 2: Use the Data in Your Project

### Node.js / CommonJS
```javascript
const GITA = require('./data.js');

const verse = GITA.find(v => v.chapter === 2 && v.verse === 47);
console.log(verse.translation);
// Output: "Yoga is skill in action..."
```

### ES6 Modules
```javascript
import GITA from './data.js';

const chapter2 = GITA.filter(v => v.chapter === 2);
console.log(`Chapter 2 has ${chapter2.length} verses`);
```

### React / Frontend
```javascript
import GITA from './data.js';

function VerseDisplay({ chapter, verse }) {
  const v = GITA.find(x => x.chapter === chapter && x.verse === verse);
  
  return (
    <div>
      <h3>{chapter}.{verse}</h3>
      <p>{v.translation}</p>
      <p lang="hi">{v.hindi}</p>
      <p>{v.transliteration}</p>
    </div>
  );
}
```

---

## Data Structure

Each verse in `GITA` array has:

```javascript
{
  chapter: 1,           // 1-18
  verse: 1,             // depends on chapter
  sanskrit: "...",      // Devanagari text
  transliteration: "...", // IAST romanization
  translation: "...",   // English
  hindi: "...",         // Hindi (when available)
  telugu: "",           // Empty (no public source)
  word_by_word: [       // Array of "term: meaning" strings
    "dharma: righteousness",
    "kshetra: field",
    // ...
  ],
  tags: []              // Empty - populate manually for your app
}
```

---

## Typical Workflows

### Find verses about a specific topic
```javascript
const karmayogaVerses = GITA.filter(v => 
  v.tags.includes('karma-yoga') || 
  v.translation.toLowerCase().includes('action')
);
```

### Get a random verse
```javascript
const random = GITA[Math.floor(Math.random() * GITA.length)];
console.log(random.translation);
```

### Display verse with all translations
```javascript
function showVerse(chapter, verse) {
  const v = GITA.find(x => x.chapter === chapter && x.verse === verse);
  
  console.log(`\n📖 ${chapter}.${verse}\n`);
  console.log('Sanskrit:');
  console.log(v.sanskrit);
  console.log('\nTransliteration:');
  console.log(v.transliteration);
  console.log('\nEnglish:');
  console.log(v.translation);
  if (v.hindi) {
    console.log('\nHindi:');
    console.log(v.hindi);
  }
  console.log('\nWord meanings:');
  console.log(v.word_by_word.join('\n'));
}

showVerse(2, 47);
```

### Save to database
```javascript
// SQLite example
const db = new sqlite3.Database('gita.db');

db.serialize(() => {
  GITA.forEach(verse => {
    db.run(
      `INSERT INTO verses (chapter, verse, sanskrit, translation, hindi)
       VALUES (?, ?, ?, ?, ?)`,
      [verse.chapter, verse.verse, verse.sanskrit, verse.translation, verse.hindi]
    );
  });
});
```

---

## Data Quality & Coverage

| Field | Coverage | Notes |
|-------|----------|-------|
| **Sanskrit** | 100% | Public domain, ancient text |
| **Transliteration** | 100% | IAST-style romanization |
| **English** | 100% | First available translation per verse |
| **Hindi** | ~95% | From Vedicscriptures (GitHub) |
| **Telugu** | 0% | No public source available (see README) |
| **Word-by-word** | 100% | English glosses parsed from source |
| **Tags** | 0% | Empty - populate manually as needed |

---

## Adding Tags for Better Searchability

The `tags` field is empty by default. Here's how to populate it:

```javascript
const GITA_WITH_TAGS = GITA.map(v => {
  const tags = [];
  
  // Add tags based on content
  if (v.translation.toLowerCase().includes('yoga')) tags.push('yoga');
  if (v.translation.toLowerCase().includes('karma')) tags.push('karma');
  if (v.translation.toLowerCase().includes('knowledge')) tags.push('knowledge');
  if (v.chapter >= 1 && v.chapter <= 6) tags.push('yoga-paths');
  if (v.chapter === 2) tags.push('sankhya-yoga');
  
  return { ...v, tags };
});
```

---

## Troubleshooting

**❌ "Permission denied" when running `generate-data.mjs`**
```bash
chmod +x generate-data.mjs
node generate-data.mjs
```

**❌ Network timeout**
- Try again later (GitHub may be rate-limiting)
- Or set `GITHUB_TOKEN` environment variable for higher limits

**❌ `data.js` file seems small**
- You're looking at the sample file
- Run `node generate-data.mjs` to get all 700 verses
- The full file will be 3-4 MB uncompressed

**❌ Need to regenerate the file**
```bash
rm data.js  # Delete old file
node generate-data.mjs  # Regenerate with fresh data
```

---

## Next Steps

1. ✅ **Review** the sample `data.js` structure
2. ✅ **Run** `node generate-data.mjs` to get all 700 verses
3. ✅ **Read** `USAGE_GUIDE.md` for your specific use case (React, CLI, database, etc.)
4. ✅ **Populate** the `tags` field for your application's domain
5. ✅ **Deploy** to your app, website, or API

---

## Resources

- **Full Documentation**: See `README.md`
- **Usage Examples**: See `USAGE_GUIDE.md` (400+ lines)
- **Data Sources**:
  - Sanskrit/English: https://github.com/gita/gita (Unlicense)
  - Hindi: https://github.com/vedicscriptures/bhagavad-gita
  - Ravisiyer Mirror: https://ravisiyer.github.io/gita-data/v1/

---

**Generated**: April 27, 2026  
**Status**: ✅ Ready to use  
**Total Verses in Full Dataset**: 700  
**Languages**: Sanskrit, Transliteration (IAST), English, Hindi, Word-by-word glosses
