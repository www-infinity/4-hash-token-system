'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readTreasury,
  addToTreasury,
  distributeFromTreasury,
  getNextTreasuryToken,
  getTreasuryStats,
} = require('../src/treasury/index');

describe('treasury', () => {
  let tmpDir;
  let ledgerPath;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'treasury-test-'));
    ledgerPath = path.join(tmpDir, 'ledger.json');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('readTreasury returns empty object when file does not exist', () => {
    const nonExistent = path.join(tmpDir, 'no-ledger.json');
    assert.deepEqual(readTreasury(nonExistent), {});
  });

  it('addToTreasury creates ledger and marks token as treasury', () => {
    addToTreasury('token_100', ledgerPath);
    const ledger = readTreasury(ledgerPath);
    assert.equal(ledger['token_100'], 'treasury');
  });

  it('addToTreasury adds multiple tokens', () => {
    addToTreasury('token_101', ledgerPath);
    addToTreasury('token_102', ledgerPath);
    const ledger = readTreasury(ledgerPath);
    assert.equal(ledger['token_101'], 'treasury');
    assert.equal(ledger['token_102'], 'treasury');
  });

  it('getNextTreasuryToken returns first available treasury token', () => {
    const next = getNextTreasuryToken(ledgerPath);
    assert.ok(next !== null);
    assert.equal(readTreasury(ledgerPath)[next], 'treasury');
  });

  it('distributeFromTreasury marks token as distributed with wallet ID', () => {
    const tokenId = getNextTreasuryToken(ledgerPath);
    distributeFromTreasury(tokenId, 'wallet_001', ledgerPath);
    const ledger = readTreasury(ledgerPath);
    assert.equal(ledger[tokenId], 'distributed:wallet_001');
  });

  it('distributeFromTreasury throws when token is not found', () => {
    assert.throws(
      () => distributeFromTreasury('token_999', 'wallet_001', ledgerPath),
      /not found/
    );
  });

  it('distributeFromTreasury throws when token is already distributed', () => {
    // token_100 was distributed in a previous test
    assert.throws(
      () => distributeFromTreasury('token_100', 'wallet_002', ledgerPath),
      /already/
    );
  });

  it('getTreasuryStats returns correct counts', () => {
    // At this point: token_100 distributed, token_101 and token_102 in treasury
    const stats = getTreasuryStats(ledgerPath);
    assert.equal(stats.distributed, 1);
    assert.equal(stats.treasury, 2);
    assert.equal(stats.total, 3);
  });

  it('getNextTreasuryToken returns null when no tokens available', () => {
    const emptyLedger = path.join(tmpDir, 'empty.json');
    assert.equal(getNextTreasuryToken(emptyLedger), null);
  });
});
