'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TREASURY_PATH = path.join(process.cwd(), 'treasury', 'ledger.json');

/**
 * Read the treasury ledger.
 *
 * The ledger is a JSON object mapping token IDs to their status:
 *   "treasury"    — token is held in treasury (not yet distributed)
 *   "distributed" — token has been sent to a wallet
 *
 * @param {string} [treasuryPath]
 * @returns {object}  { [tokenId]: "treasury" | "distributed" }
 */
function readTreasury(treasuryPath = DEFAULT_TREASURY_PATH) {
  if (!fs.existsSync(treasuryPath)) return {};
  return JSON.parse(fs.readFileSync(treasuryPath, 'utf8'));
}

/**
 * Persist the treasury ledger.
 * @param {object} ledger
 * @param {string} [treasuryPath]
 */
function writeTreasury(ledger, treasuryPath = DEFAULT_TREASURY_PATH) {
  fs.mkdirSync(path.dirname(treasuryPath), { recursive: true });
  fs.writeFileSync(treasuryPath, JSON.stringify(ledger, null, 2), 'utf8');
}

/**
 * Add a token to the treasury ledger with status "treasury".
 *
 * @param {string|number} tokenId
 * @param {string} [treasuryPath]
 * @returns {object}  updated ledger
 */
function addToTreasury(tokenId, treasuryPath = DEFAULT_TREASURY_PATH) {
  const ledger = readTreasury(treasuryPath);
  ledger[String(tokenId)] = 'treasury';
  writeTreasury(ledger, treasuryPath);
  return ledger;
}

/**
 * Mark a token as distributed and record which wallet received it.
 *
 * @param {string|number} tokenId
 * @param {string}        walletId
 * @param {string}        [treasuryPath]
 * @returns {object}  updated ledger
 * @throws {Error} if the token is not in the treasury or already distributed
 */
function distributeFromTreasury(tokenId, walletId, treasuryPath = DEFAULT_TREASURY_PATH) {
  const ledger = readTreasury(treasuryPath);
  const key = String(tokenId);

  if (!ledger[key]) {
    throw new Error(`Token '${tokenId}' not found in treasury`);
  }
  if (ledger[key] !== 'treasury') {
    throw new Error(`Token '${tokenId}' is already '${ledger[key]}', not available for distribution`);
  }

  ledger[key] = `distributed:${walletId}`;
  writeTreasury(ledger, treasuryPath);
  return ledger;
}

/**
 * Return the ID of the next available (status = "treasury") token.
 *
 * @param {string} [treasuryPath]
 * @returns {string|null}  token ID or null if treasury is empty
 */
function getNextTreasuryToken(treasuryPath = DEFAULT_TREASURY_PATH) {
  const ledger = readTreasury(treasuryPath);
  const available = Object.keys(ledger).find((id) => ledger[id] === 'treasury');
  return available || null;
}

/**
 * Count tokens by status.
 *
 * @param {string} [treasuryPath]
 * @returns {{ treasury: number, distributed: number, total: number }}
 */
function getTreasuryStats(treasuryPath = DEFAULT_TREASURY_PATH) {
  const ledger = readTreasury(treasuryPath);
  const entries = Object.values(ledger);
  const treasuryCount = entries.filter((v) => v === 'treasury').length;
  const distributedCount = entries.filter((v) => v !== 'treasury').length;
  return { treasury: treasuryCount, distributed: distributedCount, total: entries.length };
}

module.exports = {
  readTreasury,
  writeTreasury,
  addToTreasury,
  distributeFromTreasury,
  getNextTreasuryToken,
  getTreasuryStats,
};
