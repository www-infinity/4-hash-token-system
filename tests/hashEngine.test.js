'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { sha256, hashFile, hashFiles, generateFourHashes } = require('../src/token-system/hashEngine');

describe('hashEngine', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hash-engine-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sha256 returns a 64-char hex string', () => {
    const result = sha256('hello world');
    assert.equal(result.length, 64);
    assert.match(result, /^[0-9a-f]+$/);
  });

  it('sha256 is deterministic', () => {
    assert.equal(sha256('test'), sha256('test'));
  });

  it('sha256 produces different digests for different inputs', () => {
    assert.notEqual(sha256('foo'), sha256('bar'));
  });

  it('hashFile hashes a file correctly', () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'test content', 'utf8');
    const result = hashFile(filePath);
    assert.equal(result.length, 64);
    assert.equal(result, sha256('test content'));
  });

  it('hashFiles concatenates multiple files', () => {
    const f1 = path.join(tmpDir, 'a.txt');
    const f2 = path.join(tmpDir, 'b.txt');
    fs.writeFileSync(f1, 'part1', 'utf8');
    fs.writeFileSync(f2, 'part2', 'utf8');
    const combined = hashFiles([f1, f2]);
    const expected = sha256(Buffer.concat([Buffer.from('part1'), Buffer.from('part2')]));
    assert.equal(combined, expected);
  });

  it('generateFourHashes returns four distinct hex strings', () => {
    const articlePath = path.join(tmpDir, 'article.md');
    const sourcesPath = path.join(tmpDir, 'sources.txt');
    fs.writeFileSync(articlePath, '# Article', 'utf8');
    fs.writeFileSync(sourcesPath, 'source 1', 'utf8');

    const metadata = { id: 1, value: 100, type: 'Research', date: '2026-01-01' };
    const { hash1, hash2, hash3, hash4 } = generateFourHashes({ articlePath, sourcesPath, metadata });

    for (const h of [hash1, hash2, hash3, hash4]) {
      assert.equal(h.length, 64);
      assert.match(h, /^[0-9a-f]+$/);
    }

    const hashes = [hash1, hash2, hash3, hash4];
    const unique = new Set(hashes);
    assert.equal(unique.size, 4, 'All four hashes should be distinct');
  });

  it('generateFourHashes hash4 is reproducible from metadata alone', () => {
    const articlePath = path.join(tmpDir, 'article2.md');
    const sourcesPath = path.join(tmpDir, 'sources2.txt');
    fs.writeFileSync(articlePath, '# Article 2', 'utf8');
    fs.writeFileSync(sourcesPath, 'source 2', 'utf8');

    const metadata = { id: 42, value: 999, type: 'Science', date: '2026-03-13' };
    const { hash4: h4a } = generateFourHashes({ articlePath, sourcesPath, metadata });
    const { hash4: h4b } = generateFourHashes({ articlePath, sourcesPath, metadata });
    assert.equal(h4a, h4b);

    const expectedHash4 = sha256(JSON.stringify({ id: 42, value: 999, type: 'Science', date: '2026-03-13' }));
    assert.equal(h4a, expectedHash4);
  });
});
