'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { issueReceipt, readReceipt, listReceipts, makeReceiptId } = require('../src/receipts/index');

describe('receipts', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'receipts-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('makeReceiptId returns a string starting with R', () => {
    const id = makeReceiptId('spin_001', 'wallet_001', '2026-03-13T12:00:00Z');
    assert.match(id, /^R[0-9A-F]{6}$/);
  });

  it('makeReceiptId is deterministic for same inputs', () => {
    const a = makeReceiptId('spin_001', 'wallet_001', '2026-03-13T12:00:00Z');
    const b = makeReceiptId('spin_001', 'wallet_001', '2026-03-13T12:00:00Z');
    assert.equal(a, b);
  });

  it('issueReceipt creates a receipt file and returns the record', () => {
    const receipt = issueReceipt({
      spinId: 'spin_000001',
      walletId: 'wallet_001',
      timestamp: '2026-03-13T12:00:00Z',
      tokenAwarded: false,
      receiptsDir: tmpDir,
    });

    assert.ok(receipt.receipt_id);
    assert.equal(receipt.spin_id, 'spin_000001');
    assert.equal(receipt.wallet, 'wallet_001');
    assert.equal(receipt.token_awarded, false);

    const filePath = path.join(tmpDir, `${receipt.receipt_id}.json`);
    assert.ok(fs.existsSync(filePath));
  });

  it('issueReceipt with tokenAwarded=true stores correct flag', () => {
    const receipt = issueReceipt({
      spinId: 'spin_000002',
      walletId: 'wallet_001',
      timestamp: '2026-03-13T13:00:00Z',
      tokenAwarded: true,
      receiptsDir: tmpDir,
    });
    assert.equal(receipt.token_awarded, true);
  });

  it('readReceipt retrieves a stored receipt', () => {
    const issued = issueReceipt({
      spinId: 'spin_000003',
      walletId: 'wallet_002',
      timestamp: '2026-03-13T14:00:00Z',
      receiptsDir: tmpDir,
    });
    const retrieved = readReceipt(issued.receipt_id, tmpDir);
    assert.equal(retrieved.receipt_id, issued.receipt_id);
    assert.equal(retrieved.spin_id, 'spin_000003');
  });

  it('readReceipt throws when receipt does not exist', () => {
    assert.throws(() => readReceipt('RXXXXXX', tmpDir), /not found/);
  });

  it('listReceipts returns all receipt IDs in the directory', () => {
    const ids = listReceipts(tmpDir);
    assert.ok(ids.length >= 3);
    assert.ok(ids.every((id) => typeof id === 'string'));
  });

  it('listReceipts returns empty array for non-existent directory', () => {
    const noDir = path.join(tmpDir, 'nonexistent');
    assert.deepEqual(listReceipts(noDir), []);
  });

  it('issueReceipt throws when spinId is missing', () => {
    assert.throws(
      () => issueReceipt({ spinId: '', walletId: 'wallet_001', receiptsDir: tmpDir }),
      /required/
    );
  });
});
