'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createToken } = require('../src/token-system/tokenGenerator');
const { appendToLedger, readLedger, renderLedger } = require('../src/token-system/ledger');

describe('ledger', () => {
  let tmpDir;
  let ledgerPath;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-test-'));
    ledgerPath = path.join(tmpDir, 'ledger.json');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('readLedger returns empty array when file does not exist', () => {
    const nonExistent = path.join(tmpDir, 'no-ledger.json');
    assert.deepEqual(readLedger(nonExistent), []);
  });

  it('appendToLedger creates ledger file and adds entry', () => {
    const token = createToken({
      id: 100,
      value: 500,
      type: 'Research',
      date: '2026-01-01',
      articleText: 'Article for ledger test',
      sourcesText: 'Sources for ledger test',
      tokensDir: tmpDir,
    });

    const entry = appendToLedger(token, ledgerPath);
    assert.equal(entry.id, 100);
    assert.ok(entry.hash4_token_metadata);

    const ledger = readLedger(ledgerPath);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].id, 100);
  });

  it('appendToLedger appends without overwriting existing entries', () => {
    const token2 = createToken({
      id: 200,
      value: 999,
      type: 'Science',
      date: '2026-02-01',
      articleText: 'Second article',
      sourcesText: 'Second sources',
      tokensDir: tmpDir,
    });

    appendToLedger(token2, ledgerPath);
    const ledger = readLedger(ledgerPath);
    assert.equal(ledger.length, 2);
    assert.equal(ledger[1].id, 200);
  });

  it('renderLedger returns non-empty string when entries exist', () => {
    const rendered = renderLedger(ledgerPath);
    assert.ok(rendered.includes('Token 100'));
    assert.ok(rendered.includes('Token 200'));
    assert.ok(rendered.includes('💲'));
  });

  it('renderLedger returns placeholder when ledger is empty', () => {
    const emptyLedger = path.join(tmpDir, 'empty.json');
    const result = renderLedger(emptyLedger);
    assert.ok(result.includes('empty'));
  });
});
