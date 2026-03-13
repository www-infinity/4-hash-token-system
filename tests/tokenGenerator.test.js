'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createToken, formatTokenRecord, emojiForType, TOKEN_EMOJIS } = require('../src/token-system/tokenGenerator');

describe('tokenGenerator', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-gen-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('emojiForType returns correct emoji for known types', () => {
    assert.equal(emojiForType('Research'), '🧱');
    assert.equal(emojiForType('Discovery'), '⭐');
    assert.equal(emojiForType('Economic'), '💲');
    assert.equal(emojiForType('Science'), '🧬');
  });

  it('emojiForType defaults to 🧱 for unknown type', () => {
    assert.equal(emojiForType('Unknown'), '🧱');
  });

  it('TOKEN_EMOJIS has expected keys', () => {
    const keys = Object.keys(TOKEN_EMOJIS);
    assert.ok(keys.includes('Research'));
    assert.ok(keys.includes('Discovery'));
    assert.ok(keys.includes('Economic'));
    assert.ok(keys.includes('Science'));
  });

  it('createToken writes required files and returns hash fields', () => {
    const token = createToken({
      id: 1054,
      value: 2593,
      type: 'Research',
      date: '2026-03-13',
      articleText: '# Test article\n\nSome content.',
      sourcesText: 'Source 1: https://example.com',
      tokensDir: tmpDir,
    });

    assert.ok(token.hash1_article, 'hash1_article should be set');
    assert.ok(token.hash2_sources, 'hash2_sources should be set');
    assert.ok(token.hash3_research_package, 'hash3_research_package should be set');
    assert.ok(token.hash4_token_metadata, 'hash4_token_metadata should be set');

    const tokenDir = path.join(tmpDir, 'token_1054');
    assert.ok(fs.existsSync(path.join(tokenDir, 'article.md')));
    assert.ok(fs.existsSync(path.join(tokenDir, 'sources.txt')));
    assert.ok(fs.existsSync(path.join(tokenDir, 'metadata.json')));
    assert.ok(fs.existsSync(path.join(tokenDir, 'hashes.json')));
  });

  it('createToken hashes.json contains all 4 keys', () => {
    createToken({
      id: 2000,
      value: 100,
      type: 'Science',
      date: '2026-01-01',
      articleText: 'Article text',
      sourcesText: 'Sources',
      tokensDir: tmpDir,
    });
    const hashesPath = path.join(tmpDir, 'token_2000', 'hashes.json');
    const hashes = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
    assert.ok(hashes.hash1_article);
    assert.ok(hashes.hash2_sources);
    assert.ok(hashes.hash3_research_package);
    assert.ok(hashes.hash4_token_metadata);
  });

  it('createToken metadata.json has correct values', () => {
    createToken({
      id: 3000,
      value: 500,
      type: 'Discovery',
      date: '2026-06-01',
      articleText: 'Discovery article',
      sourcesText: 'Discovery sources',
      tokensDir: tmpDir,
    });
    const meta = JSON.parse(fs.readFileSync(path.join(tmpDir, 'token_3000', 'metadata.json'), 'utf8'));
    assert.equal(meta.id, 3000);
    assert.equal(meta.value, 500);
    assert.equal(meta.type, 'Discovery');
    assert.equal(meta.date, '2026-06-01');
    assert.equal(meta.emoji, '⭐');
  });

  it('formatTokenRecord produces expected output', () => {
    const token = {
      id: 1054,
      value: 2593,
      type: 'Research',
      date: '2026-03-13',
      hash1_article: 'aaa',
      hash2_sources: 'bbb',
      hash3_research_package: 'ccc',
      hash4_token_metadata: 'ddd',
    };
    const record = formatTokenRecord(token);
    assert.ok(record.includes('ID: 1054'));
    assert.ok(record.includes('Value: 2593'));
    assert.ok(record.includes('HASH1_ARTICLE:'));
    assert.ok(record.includes('HASH4_TOKEN_METADATA:'));
  });
});
