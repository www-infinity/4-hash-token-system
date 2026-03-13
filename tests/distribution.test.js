'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { distributeToken, ONE_HOUR_MS } = require('../src/distribution/index');
const { addToTreasury } = require('../src/treasury/index');

describe('distribution', () => {
  let tmpDir;
  let treasuryPath;
  let receiptsDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'distribution-test-'));
    treasuryPath = path.join(tmpDir, 'treasury.json');
    receiptsDir = path.join(tmpDir, 'receipts');

    // Pre-populate treasury with three tokens
    addToTreasury('token_200', treasuryPath);
    addToTreasury('token_201', treasuryPath);
    addToTreasury('token_202', treasuryPath);
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ONE_HOUR_MS equals 3600000', () => {
    assert.equal(ONE_HOUR_MS, 3_600_000);
  });

  it('distributes a token when wallet has never received one', () => {
    const wallet = { wallet_id: 'wallet_001', tokens: [], last_token_time: null };
    const result = distributeToken({ wallet, spinId: 'spin_001', treasuryPath, receiptsDir });

    assert.equal(result.tokenDistributed, true);
    assert.equal(result.tokenId, 'token_200');
    assert.ok(result.wallet.tokens.includes('token_200'));
    assert.ok(result.wallet.last_token_time > 0);
    assert.ok(result.receipt.token_awarded === true);
  });

  it('does NOT distribute when wallet received token less than 1 hour ago', () => {
    const wallet = {
      wallet_id: 'wallet_002',
      tokens: ['token_200'],
      last_token_time: Date.now() - 1000, // 1 second ago
    };
    const result = distributeToken({ wallet, spinId: 'spin_002', treasuryPath, receiptsDir });

    assert.equal(result.tokenDistributed, false);
    assert.equal(result.tokenId, null);
    assert.equal(result.receipt.token_awarded, false);
  });

  it('distributes when wallet last received token more than 1 hour ago', () => {
    const wallet = {
      wallet_id: 'wallet_003',
      tokens: [],
      last_token_time: Date.now() - ONE_HOUR_MS - 1000, // just over 1 hour ago
    };
    const result = distributeToken({ wallet, spinId: 'spin_003', treasuryPath, receiptsDir });

    assert.equal(result.tokenDistributed, true);
    assert.ok(result.wallet.tokens.length > 0);
  });

  it('issues a receipt even when not distributing', () => {
    const wallet = {
      wallet_id: 'wallet_004',
      tokens: [],
      last_token_time: Date.now() - 500, // too recent
    };
    const result = distributeToken({ wallet, spinId: 'spin_004', treasuryPath, receiptsDir });

    assert.equal(result.tokenDistributed, false);
    assert.ok(result.receipt !== null);
    assert.ok(result.receipt.receipt_id);

    // Confirm the receipt file exists on disk
    const filePath = path.join(receiptsDir, `${result.receipt.receipt_id}.json`);
    assert.ok(fs.existsSync(filePath));
  });

  it('returns null tokenId and issues receipt when treasury is empty', () => {
    const emptyTreasury = path.join(tmpDir, 'empty-treasury.json');
    // Don't add anything — treasury is empty

    const wallet = { wallet_id: 'wallet_005', tokens: [], last_token_time: null };
    const result = distributeToken({ wallet, spinId: 'spin_005', treasuryPath: emptyTreasury, receiptsDir });

    assert.equal(result.tokenDistributed, false);
    assert.equal(result.tokenId, null);
    assert.ok(result.receipt !== null);
  });
});
