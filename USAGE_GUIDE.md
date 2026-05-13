# Using the Generated data.js

This guide shows how to use the compiled Bhagavad Gita dataset in different environments.

## Table of Contents
1. [Node.js / CommonJS](#nodejs--commonjs)
2. [ES6 Modules](#es6-modules)
3. [Browser (Bundled)](#browser-bundled)
4. [Browser (via CDN)](#browser-via-cdn)
5. [React App](#react-app)
6. [CLI Queries](#cli-queries)
7. [Database Import](#database-import)

---

## Node.js / CommonJS

### Using CommonJS `require()`

```javascript
const GITA = require('./data.js');

// Find verse 2.47
const verse = GITA.find(v => v.chapter === 2 && v.verse === 47);
console.log(verse.translation);
// Output: "Yoga is skill in action."
```

### Using ES6 `import`

```javascript
import GITA from './data.js';

const verse = GITA.find(v => v.chapter === 2 && v.verse === 47);
console.log(verse.translation);
```

---

## ES6 Modules

The generated `data.js` works with both CommonJS and ES Modules:

```javascript
// In package.json
{
  "type": "module"
}

// In your code
import GITA from './data.js';

// Filter by chapter
const chapter5 = GITA.filter(v => v.chapter === 5);
console.log(`Chapter 5 has ${chapter5.length} verses`);

// Get a specific verse
const verse1_1 = GITA.find(v => v.chapter === 1 && v.verse === 1);
console.log(verse1_1.sanskrit);
```

---

## Browser (Bundled)

### With Webpack / Vite / esbuild

```javascript
import GITA from './data.js';

function displayVerse(chapter, verse) {
  const v = GITA.find(x => x.chapter === chapter && x.verse === verse);
  if (!v) return null;

  return {
    sanskrit: v.sanskrit,
    english: v.translation,
    hindi: v.hindi,
    meanings: v.word_by_word
  };
}

const gita247 = displayVerse(2, 47);
console.log(gita247.english);
```

### Tree-shaking / Code Splitting

If your data.js is very large (3-4 MB), consider splitting by chapter:

```bash
# Split data.js into 18 chapter files
node -e "
const GITA = require('./data.js');
const fs = require('fs');
for (let ch = 1; ch <= 18; ch++) {
  const verses = GITA.filter(v => v.chapter === ch);
  fs.writeFileSync(
    \`./chapters/ch\${ch}.js\`,
    \`export default \${JSON.stringify(verses)};\`
  );
}
"
```

Then in your app:
```javascript
// Only load the chapter you need
const chapter2 = await import('./chapters/ch2.js').then(m => m.default);
```

---

## Browser (via CDN)

### Host on a CDN

1. Minify and gzip data.js:
   ```bash
   npm install -g terser
   terser data.js -o data.min.js
   gzip -k data.min.js
   ```

2. Upload to a CDN (e.g., CloudFront, Cloudflare, etc.)

3. Load in your HTML:
   ```html
   <script src="https://cdn.example.com/gita-data.min.js"></script>
   <script>
     // GITA is globally available
     const verse = GITA.find(v => v.chapter === 2 && v.verse === 47);
     console.log(verse.translation);
   </script>
   ```

---

## React App

### Simple Search Component

```jsx
import { useState } from 'react';
import GITA from './data.js';

export default function GitaSearch() {
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const currentVerse = GITA.find(v => v.chapter === Number(chapter) && v.verse === Number(verse));

  if (!currentVerse) {
    return <div>Verse not found</div>;
  }

  return (
    <div>
      <h1>Bhagavad Gita</h1>
      
      <div>
        <label>
          Chapter:
          <input
            type="number"
            min="1"
            max="18"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />
        </label>
        <label>
          Verse:
          <input
            type="number"
            min="1"
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
          />
        </label>
      </div>

      <div>
        <h2>{chapter}.{verse}</h2>
        
        <details>
          <summary>Sanskrit</summary>
          <p style={{ fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
            {currentVerse.sanskrit}
          </p>
        </details>

        <details>
          <summary>Transliteration</summary>
          <p>{currentVerse.transliteration}</p>
        </details>

        <h3>English Translation</h3>
        <p>{currentVerse.translation}</p>

        {currentVerse.hindi && (
          <>
            <h3>Hindi Translation</h3>
            <p>{currentVerse.hindi}</p>
          </>
        )}

        <details>
          <summary>Word-by-Word Meaning</summary>
          <ul>
            {currentVerse.word_by_word.map((meaning, i) => (
              <li key={i}>{meaning}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
```

### With Search by Tag

```jsx
import { useMemo, useState } from 'react';
import GITA from './data.js';

export default function TagSearch() {
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = useMemo(() => {
    const tags = new Set();
    GITA.forEach(v => v.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedTag) return [];
    return GITA.filter(v => v.tags.includes(selectedTag));
  }, [selectedTag]);

  return (
    <div>
      <h1>Browse by Topic</h1>
      
      <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
        <option value="">Select a topic...</option>
        {allTags.map(tag => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>

      <div>
        {filtered.map(verse => (
          <div key={`${verse.chapter}-${verse.verse}`}>
            <h3>{verse.chapter}.{verse.verse}</h3>
            <p>{verse.translation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## CLI Queries

### Quick Lookup from Command Line

```bash
# Create a simple CLI tool
cat > gita-cli.mjs << 'EOF'
import GITA from './data.js';

const [ch, v] = process.argv.slice(2);
const verse = GITA.find(x => x.chapter === Number(ch) && x.verse === Number(v));

if (!verse) {
  console.log(`Verse ${ch}.${v} not found`);
  process.exit(1);
}

console.log(`\n📖 Bhagavad Gita ${ch}.${v}\n`);
console.log('Sanskrit:');
console.log(verse.sanskrit);
console.log('\nTranslation:');
console.log(verse.translation);
if (verse.hindi) {
  console.log('\nHindi:');
  console.log(verse.hindi);
}
console.log('\n');
EOF

# Usage
node gita-cli.mjs 2 47
# Output:
# 📖 Bhagavad Gita 2.47
#
# Sanskrit:
# योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।
# ...
```

### Search by Translation

```bash
cat > gita-search.mjs << 'EOF'
import GITA from './data.js';

const query = process.argv[2].toLowerCase();
const results = GITA.filter(v => 
  v.translation.toLowerCase().includes(query) ||
  v.hindi.toLowerCase().includes(query)
);

console.log(`Found ${results.length} verse(s):\n`);
results.forEach(v => {
  console.log(`${v.chapter}.${v.verse}: ${v.translation.slice(0, 60)}...`);
});
EOF

node gita-search.mjs "yoga"
```

---

## Database Import

### SQLite

```javascript
import sqlite3 from 'sqlite3';
import GITA from './data.js';

const db = new sqlite3.Database('./gita.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY,
      chapter INTEGER,
      verse INTEGER,
      sanskrit TEXT,
      transliteration TEXT,
      translation TEXT,
      hindi TEXT,
      telugu TEXT,
      word_by_word TEXT,
      tags TEXT,
      UNIQUE(chapter, verse)
    )
  `);

  const stmt = db.prepare(`
    INSERT INTO verses (chapter, verse, sanskrit, transliteration, translation, hindi, telugu, word_by_word, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  GITA.forEach(v => {
    stmt.run(
      v.chapter,
      v.verse,
      v.sanskrit,
      v.transliteration,
      v.translation,
      v.hindi,
      v.telugu,
      JSON.stringify(v.word_by_word),
      JSON.stringify(v.tags)
    );
  });

  stmt.finalize();
  console.log('✅ Imported 700 verses into SQLite');
  db.close();
});
```

### MongoDB

```javascript
import { MongoClient } from 'mongodb';
import GITA from './data.js';

async function importToMongo() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('gita');
  const collection = db.collection('verses');

  // Clear existing data
  await collection.deleteMany({});

  // Insert all verses
  const result = await collection.insertMany(GITA);
  console.log(`✅ Inserted ${result.insertedCount} verses`);

  // Create index for faster queries
  await collection.createIndex({ chapter: 1, verse: 1 });
  await collection.createIndex({ tags: 1 });

  await client.close();
}

importToMongo().catch(console.error);
```

### PostgreSQL

```javascript
import pg from 'pg';
import GITA from './data.js';

const client = new pg.Client({
  connectionString: 'postgresql://user:password@localhost:5432/gita'
});

async function importToPostgres() {
  await client.connect();

  // Create table
  await client.query(`
    CREATE TABLE IF NOT EXISTS verses (
      id SERIAL PRIMARY KEY,
      chapter SMALLINT,
      verse SMALLINT,
      sanskrit TEXT,
      transliteration TEXT,
      translation TEXT,
      hindi TEXT,
      telugu TEXT,
      word_by_word JSONB,
      tags JSONB,
      UNIQUE(chapter, verse)
    )
  `);

  // Batch insert
  const query = `
    INSERT INTO verses (chapter, verse, sanskrit, transliteration, translation, hindi, telugu, word_by_word, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (chapter, verse) DO NOTHING
  `;

  for (const v of GITA) {
    await client.query(query, [
      v.chapter,
      v.verse,
      v.sanskrit,
      v.transliteration,
      v.translation,
      v.hindi,
      v.telugu,
      JSON.stringify(v.word_by_word),
      JSON.stringify(v.tags)
    ]);
  }

  console.log('✅ Imported 700 verses into PostgreSQL');
  await client.end();
}

importToPostgres().catch(console.error);
```

---

## Next Steps

1. **Run the build script**: `node build_gita.mjs`
2. **Choose your use case** from above
3. **Implement the relevant code**
4. **Consider adding tags** to verses for better searchability
5. **Test with a few queries** to ensure the data is correct

For questions or issues, refer to the main README.md.
