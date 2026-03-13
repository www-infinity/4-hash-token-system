'use strict';

const fs = require('fs');
const path = require('path');
const { emojiForType } = require('./tokenGenerator');

const DEFAULT_LEDGER = path.join(process.cwd(), 'tokens', 'ledger.json');

/**
 * Append a token record to the ledger.
 *
 * The ledger is an append-only JSON array stored at ledgerPath.
 * Each entry contains the emoji fields, value, and HASH4 for quick lookup.
 *
 * @param {object} token      result of createToken()
 * @param {string} [ledgerPath]  path to ledger.json
 */
function appendToLedger(token, ledgerPath = DEFAULT_LEDGER) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });

  let ledger = [];
  if (fs.existsSync(ledgerPath)) {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  }

  const entry = {
    emoji: emojiForType(token.type),
    id: token.id,
    value: token.value,
    type: token.type,
    date: token.date,
    hash4_token_metadata: token.hash4_token_metadata,
  };

  ledger.push(entry);
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
  return entry;
}

/**
 * Read and return the full ledger array.
 * @param {string} [ledgerPath]
 * @returns {object[]}
 */
function readLedger(ledgerPath = DEFAULT_LEDGER) {
  if (!fs.existsSync(ledgerPath)) return [];
  return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
}

/**
 * Render the ledger as a human-readable markdown string suitable for display
 * in a treasury page, README, or token explorer.
 * @param {string} [ledgerPath]
 * @returns {string}
 */
function renderLedger(ledgerPath = DEFAULT_LEDGER) {
  const entries = readLedger(ledgerPath);
  if (entries.length === 0) return '*(empty ledger)*';

  return entries
    .map(
      (e) =>
        `${e.emoji} Token ${e.id}\n💲 Value ${e.value}\n⭐ ${e.type}\n📅 ${e.date}\nHASH4 ${e.hash4_token_metadata}`
    )
    .join('\n\n---\n\n');
}

module.exports = { appendToLedger, readLedger, renderLedger };
