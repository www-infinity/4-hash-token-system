'use strict';

const fs = require('fs');
const path = require('path');
const { sha256, hashFile, hashFiles } = require('./hashEngine');

/**
 * Verify all four hashes for a token folder.
 *
 * Hash map:
 *   HASH1 — SHA-256 of article.md
 *   HASH2 — SHA-256 of sources.txt  (or sources.json for spin tokens)
 *   HASH3 — SHA-256 of article + sources concatenated (research package)
 *   HASH4 — SHA-256 of JSON-serialised { id, value, type, date }
 *
 * @param {string} tokenDir  path to the token folder containing hashes.json and metadata.json
 * @returns {{
 *   valid: boolean,
 *   checks: { hash1: boolean, hash2: boolean, hash3: boolean, hash4: boolean },
 *   stored: object,
 *   computed: object
 * }}
 */
function verifyToken(tokenDir) {
  const hashesPath = path.join(tokenDir, 'hashes.json');
  const metadataPath = path.join(tokenDir, 'metadata.json');

  if (!fs.existsSync(hashesPath)) {
    throw new Error(`hashes.json not found in ${tokenDir}`);
  }
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`metadata.json not found in ${tokenDir}`);
  }

  const stored = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // Resolve article and sources paths — support both .txt and .json sources
  const articlePath = path.join(tokenDir, 'article.md');
  const sourcesPathTxt = path.join(tokenDir, 'sources.txt');
  const sourcesPathJson = path.join(tokenDir, 'sources.json');

  const sourcesPath = fs.existsSync(sourcesPathTxt)
    ? sourcesPathTxt
    : fs.existsSync(sourcesPathJson)
    ? sourcesPathJson
    : null;

  if (!fs.existsSync(articlePath)) {
    throw new Error(`article.md not found in ${tokenDir}`);
  }
  if (!sourcesPath) {
    throw new Error(`sources.txt / sources.json not found in ${tokenDir}`);
  }

  // Recompute all four hashes
  const computedHash1 = hashFile(articlePath);
  const computedHash2 = hashFile(sourcesPath);
  const computedHash3 = hashFiles([articlePath, sourcesPath]);
  const computedHash4 = sha256(
    JSON.stringify({ id: metadata.id, value: metadata.value, type: metadata.type, date: metadata.date })
  );

  const computed = {
    hash1_article: computedHash1,
    hash2_sources: computedHash2,
    hash3_research_package: computedHash3,
    hash4_token_metadata: computedHash4,
  };

  const checks = {
    hash1: stored.hash1_article === computedHash1,
    hash2: stored.hash2_sources === computedHash2,
    hash3: stored.hash3_research_package === computedHash3,
    hash4: stored.hash4_token_metadata === computedHash4,
  };

  const valid = Object.values(checks).every(Boolean);

  return { valid, checks, stored, computed };
}

/**
 * Verify a token and return a human-readable verification report.
 * @param {string} tokenDir
 * @returns {string}
 */
function verifyTokenReport(tokenDir) {
  const { valid, checks, stored, computed } = verifyToken(tokenDir);

  const lines = [
    `Token Verification — ${path.basename(tokenDir)}`,
    '─'.repeat(48),
    `HASH1 (article)          ${checks.hash1 ? '✅ PASS' : '❌ FAIL'}`,
    `HASH2 (sources)          ${checks.hash2 ? '✅ PASS' : '❌ FAIL'}`,
    `HASH3 (research package) ${checks.hash3 ? '✅ PASS' : '❌ FAIL'}`,
    `HASH4 (token metadata)   ${checks.hash4 ? '✅ PASS' : '❌ FAIL'}`,
    '─'.repeat(48),
    `Overall: ${valid ? '✅ VERIFIED' : '❌ TAMPERED'}`,
  ];

  if (!valid) {
    lines.push('');
    lines.push('Failed hash details:');

    const checkToStoredKey = {
      hash1: 'hash1_article',
      hash2: 'hash2_sources',
      hash3: 'hash3_research_package',
      hash4: 'hash4_token_metadata',
    };

    for (const [key, pass] of Object.entries(checks)) {
      if (!pass) {
        const storeKey = checkToStoredKey[key];
        lines.push(`  ${storeKey}`);
        lines.push(`    stored:   ${stored[storeKey]}`);
        lines.push(`    computed: ${computed[storeKey]}`);
      }
    }
  }

  return lines.join('\n');
}

module.exports = { verifyToken, verifyTokenReport };
