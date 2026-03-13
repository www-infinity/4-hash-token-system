'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createToken } = require('../src/token-system/tokenGenerator');
const { verifyToken, verifyTokenReport } = require('../src/token-system/verifier');

describe('verifier', () => {
  let tmpDir;
  let tokenDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifier-test-'));

    // Create a valid token to verify
    createToken({
      id: 9001,
      value: 500,
      type: 'Research',
      date: '2026-03-13',
      articleText: '# Verified Research\n\nThis article is complete and unmodified.',
      sourcesText: 'Source 1: https://arxiv.org/abs/example',
      tokensDir: tmpDir,
    });
    tokenDir = path.join(tmpDir, 'token_9001');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('verifyToken returns valid=true for an unmodified token', () => {
    const result = verifyToken(tokenDir);
    assert.equal(result.valid, true);
    assert.equal(result.checks.hash1, true);
    assert.equal(result.checks.hash2, true);
    assert.equal(result.checks.hash3, true);
    assert.equal(result.checks.hash4, true);
  });

  it('verifyToken returns all four computed hashes', () => {
    const result = verifyToken(tokenDir);
    for (const key of ['hash1_article', 'hash2_sources', 'hash3_research_package', 'hash4_token_metadata']) {
      assert.ok(result.computed[key], `computed.${key} should be set`);
      assert.match(result.computed[key], /^[0-9a-f]{64}$/);
    }
  });

  it('verifyToken detects tampered article.md (hash1 fails)', () => {
    // Tamper with article
    const articlePath = path.join(tokenDir, 'article.md');
    const original = fs.readFileSync(articlePath, 'utf8');
    fs.writeFileSync(articlePath, original + '\n<!-- tampered -->', 'utf8');

    const result = verifyToken(tokenDir);
    assert.equal(result.valid, false);
    assert.equal(result.checks.hash1, false);
    assert.equal(result.checks.hash3, false); // package hash also fails

    // Restore
    fs.writeFileSync(articlePath, original, 'utf8');
  });

  it('verifyToken passes again after restoring tampered article', () => {
    const result = verifyToken(tokenDir);
    assert.equal(result.valid, true);
  });

  it('verifyToken detects tampered sources.txt (hash2 fails)', () => {
    const sourcesPath = path.join(tokenDir, 'sources.txt');
    const original = fs.readFileSync(sourcesPath, 'utf8');
    fs.writeFileSync(sourcesPath, original + '\n<!-- tampered -->', 'utf8');

    const result = verifyToken(tokenDir);
    assert.equal(result.valid, false);
    assert.equal(result.checks.hash2, false);
    assert.equal(result.checks.hash3, false);

    // Restore
    fs.writeFileSync(sourcesPath, original, 'utf8');
  });

  it('verifyToken detects tampered metadata.json (hash4 fails)', () => {
    const metadataPath = path.join(tokenDir, 'metadata.json');
    const original = fs.readFileSync(metadataPath, 'utf8');
    const meta = JSON.parse(original);
    meta.value = 9999; // tamper with value
    fs.writeFileSync(metadataPath, JSON.stringify(meta, null, 2), 'utf8');

    const result = verifyToken(tokenDir);
    assert.equal(result.valid, false);
    assert.equal(result.checks.hash4, false);

    // Restore
    fs.writeFileSync(metadataPath, original, 'utf8');
  });

  it('verifyTokenReport returns a string containing PASS for a valid token', () => {
    const report = verifyTokenReport(tokenDir);
    assert.ok(typeof report === 'string');
    assert.ok(report.includes('PASS'));
    assert.ok(report.includes('VERIFIED'));
  });

  it('verifyToken throws when hashes.json is missing', () => {
    const badDir = path.join(tmpDir, 'no_hashes');
    fs.mkdirSync(badDir, { recursive: true });
    assert.throws(() => verifyToken(badDir), /hashes\.json not found/);
  });

  it('verifyToken throws when metadata.json is missing', () => {
    const badDir = path.join(tmpDir, 'no_metadata');
    fs.mkdirSync(badDir, { recursive: true });
    fs.writeFileSync(path.join(badDir, 'hashes.json'), '{}', 'utf8');
    assert.throws(() => verifyToken(badDir), /metadata\.json not found/);
  });
});
