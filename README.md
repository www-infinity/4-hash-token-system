# 4-hash-token-system

**C13B0 Token System — 4-Hash Architecture**

> Not limited to 4 hashes — but these four are foundational.

A Node.js module that creates verifiable research tokens with four independent SHA-256 hashes, a science-seed-powered spin research writer, and an encrypted user authentication system.

---

## 4-Hash Model

Each token generates four hashes from its research files:

| Hash | Protects |
|------|----------|
| HASH1 | Research article only |
| HASH2 | Sources / citations only |
| HASH3 | Combined research package (article + sources) |
| HASH4 | Token identity metadata |

Even if one component is modified, the system detects it immediately.

---

## Token Metadata Format

```
🧱🧱🧱 Token ID
💲 Value
⭐ Token Type
📅 Date
```

Token types and their emojis:

| Type | Emoji |
|------|-------|
| Research | 🧱 |
| Discovery | ⭐ |
| Economic | 💲 |
| Science | 🧬 |
| Machine | ⚙️ |
| Archive | 📜 |

---

## Storage Layout

```
tokens/
  token_1054/
    article.md       ← research article
    sources.txt      ← citations / source list
    metadata.json    ← token identity
    hashes.json      ← all 4 hashes

spins/
  spin_000001/
    spin.json
    README.md
    research.md      ← 750–1,800 word research article
    sources.json
    equations.json
    ontology.json
    token.json
    hashes.json
    prompt.md
```

---

## Quick Start

```js
const { createToken, appendToLedger, renderLedger } = require('./src');

// 1 — Create a token
const token = createToken({
  id: 1054,
  value: 2593,
  type: 'Research',
  date: '2026-03-13',
  articleText: fs.readFileSync('article.md', 'utf8'),
  sourcesText: fs.readFileSync('sources.txt', 'utf8'),
});

// 2 — Append to ledger
appendToLedger(token);

// 3 — Render ledger
console.log(renderLedger());
```

---

## Spin Research Writer

Turns every spin event into a permanent science research packet:

```js
const { spinEngine } = require('./src');

spinEngine.writeSpinResearchPacket({
  spin_id: 'spin_000001',
  created_at: '2026-03-13T12:00:00Z',
  token_emoji: '🧱',
  token_type: 'Science',
  value: 100,
  score: 777,
  symbols: ['hydrogen', 'oxide', 'compression', 'helium'],
  status: 'active',
});
```

The writer:
1. Loads the **1,000-term science seed bank** (20 domains)
2. Maps spin symbols to relevant terms and topic clusters
3. Writes a research article, sources, equations, ontology, and token files
4. Seals the packet with 4 SHA-256 hashes
5. Never overwrites a prior spin packet

---

## Science Seed Ontology

`src/spin-engine/data/science_seed_1000.json` contains 1,003 terms across 20 scientific domains:

materials_science · quantum_physics · thermodynamics · plasma_physics · optics · semiconductors · electrochemistry · nanotechnology · metallurgy · crystallography · signal_theory · fluid_dynamics · control_systems · spectroscopy · radiation_physics · computational_modeling · applied_math · mechanics · engineering_failure · advanced_energy_systems

New terms discovered from arXiv queries or web mining are appended to `ontology_growth.json` without modifying the starter bank.

---

## User Authentication

Users sign in with bcrypt-hashed passwords and AES-256-GCM encrypted profile files.

**Set your encryption secret via environment variable:**

```bash
export ENCRYPTION_SECRET="your-32-char-or-longer-secret-key"
```

```js
const { auth } = require('./src');

// Register
await auth.registerUser({ username: 'alice', password: 'pass123', secret: process.env.ENCRYPTION_SECRET });

// Login
const profile = await auth.loginUser({ username: 'alice', password: 'pass123', secret: process.env.ENCRYPTION_SECRET });

// Record play time — earns 1 token per hour
auth.recordPlayHours({ username: 'alice', secret: process.env.ENCRYPTION_SECRET, hoursToAdd: 1 });

// Add a research token to wallet
auth.addTokenToWallet({ username: 'alice', secret: process.env.ENCRYPTION_SECRET, token: { id: 1054, value: 2593 } });
```

User profile files are stored encrypted in `users/`. No plaintext passwords are ever written to disk.

---

## C13B0 Spin Writer

Each spin is a permanent research cartridge.

A spin is not only a game event — it is a record-generation event.

When a spin is created, the system:
- reads spin metadata
- maps the spin into science domains
- loads the 1,000-term ontology starter bank
- writes a research article (750–1,800 words)
- stores sources, equations, ontology terms, and token metadata
- seals the packet with 4 hashes

This turns each spin into:
- a science note
- a token record
- a knowledge cartridge
- a forever archive

---

## Running Tests

```bash
npm test
```

44 tests covering hash engine, token generator, ledger, spin engine, and user auth.

---

## Module Structure

```
src/
  index.js
  token-system/
    hashEngine.js       ← SHA-256 utilities, generateFourHashes()
    tokenGenerator.js   ← createToken(), formatTokenRecord()
    ledger.js           ← appendToLedger(), readLedger(), renderLedger()
    index.js
  spin-engine/
    data/
      science_seed_1000.json   ← 1,003-term starter ontology
    research-writer/
      ontologyEngine.js        ← term matching and cluster building
      spinWriter.js            ← writeSpinResearchPacket()
      index.js
  auth/
    userAuth.js     ← registerUser(), loginUser(), addTokenToWallet(), recordPlayHours()
    index.js
tests/
  hashEngine.test.js
  tokenGenerator.test.js
  ledger.test.js
  spinEngine.test.js
  userAuth.test.js
```

