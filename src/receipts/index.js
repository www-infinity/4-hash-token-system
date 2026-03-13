'use strict';

const fs = require('fs');
const path = require('path');
const { sha256 } = require('../token-system/hashEngine');

const DEFAULT_RECEIPTS_DIR = path.join(process.cwd(), 'receipts');

/**
 * Generate a short deterministic receipt ID from spin + wallet + timestamp.
 * @param {string} spinId
 * @param {string} walletId
 * @param {string} timestamp
 * @returns {string}  e.g. "R8A421B"
 */
function makeReceiptId(spinId, walletId, timestamp) {
  const digest = sha256(`${spinId}:${walletId}:${timestamp}`);
  return 'R' + digest.slice(0, 6).toUpperCase();
}

/**
 * Issue a receipt for spin activity that did not result in a token award.
 *
 * Receipts prove the user performed a spin but do NOT confer token ownership.
 * They are stored as JSON files in the receipts directory.
 *
 * @param {object} params
 * @param {string}  params.spinId
 * @param {string}  params.walletId
 * @param {string}  [params.timestamp]     ISO string, defaults to now
 * @param {boolean} [params.tokenAwarded]  defaults to false
 * @param {string}  [params.receiptsDir]   directory to store receipts
 * @returns {object}  the receipt record
 */
function issueReceipt({ spinId, walletId, timestamp, tokenAwarded = false, receiptsDir = DEFAULT_RECEIPTS_DIR }) {
  if (!spinId || !walletId) {
    throw new Error('spinId and walletId are required to issue a receipt');
  }

  const ts = timestamp || new Date().toISOString();
  const receiptId = makeReceiptId(spinId, walletId, ts);

  const receipt = {
    receipt_id: receiptId,
    spin_id: spinId,
    wallet: walletId,
    timestamp: ts,
    token_awarded: tokenAwarded,
  };

  fs.mkdirSync(receiptsDir, { recursive: true });
  const filePath = path.join(receiptsDir, `${receiptId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(receipt, null, 2), 'utf8');

  return receipt;
}

/**
 * Read a receipt by its ID.
 * @param {string} receiptId
 * @param {string} [receiptsDir]
 * @returns {object}
 */
function readReceipt(receiptId, receiptsDir = DEFAULT_RECEIPTS_DIR) {
  const filePath = path.join(receiptsDir, `${receiptId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Receipt '${receiptId}' not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * List all receipt IDs in the receipts directory.
 * @param {string} [receiptsDir]
 * @returns {string[]}
 */
function listReceipts(receiptsDir = DEFAULT_RECEIPTS_DIR) {
  if (!fs.existsSync(receiptsDir)) return [];
  return fs
    .readdirSync(receiptsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

module.exports = { issueReceipt, readReceipt, listReceipts, makeReceiptId };
