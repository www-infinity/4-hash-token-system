'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { writeSpinResearchPacket } = require('../src/spin-engine/research-writer/spinWriter');
const {
  matchSymbolsToOntology,
  buildTopicClusters,
  buildNextQueries,
  loadSeedOntology,
} = require('../src/spin-engine/research-writer/ontologyEngine');

const TEST_SPIN = {
  spin_id: 'spin_000001',
  created_at: '2026-03-13T12:00:00Z',
  token_emoji: '🧱',
  token_type: 'Science',
  value: 100,
  score: 777,
  symbols: ['hydrogen', 'oxide', 'compression', 'helium'],
  query_seed: ['hydrogen portal', 'aluminum oxide'],
  status: 'active',
};

describe('spinEngine', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spin-engine-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('ontologyEngine', () => {
    it('loadSeedOntology has 20 domains', () => {
      const seed = loadSeedOntology();
      assert.equal(Object.keys(seed).length, 20);
    });

    it('loadSeedOntology has at least 1000 total terms', () => {
      const seed = loadSeedOntology();
      const total = Object.values(seed).reduce((s, arr) => s + arr.length, 0);
      assert.ok(total >= 1000, `Expected >= 1000 terms, got ${total}`);
    });

    it('matchSymbolsToOntology returns matched terms for known science words', () => {
      const { matchedTerms, domainScores } = matchSymbolsToOntology(['hydrogen', 'band', 'entropy']);
      assert.ok(matchedTerms.length > 0, 'Expected some matched terms');
      assert.ok(Object.keys(domainScores).length > 0, 'Expected some domain scores');
    });

    it('buildTopicClusters returns array of strings', () => {
      const clusters = buildTopicClusters(['hydrogen', 'oxide'], ['band gap', 'entropy production']);
      assert.ok(Array.isArray(clusters));
      assert.ok(clusters.length > 0);
    });

    it('buildNextQueries returns paired query strings', () => {
      const clusters = ['hydrogen', 'oxide', 'compression', 'entropy'];
      const queries = buildNextQueries(clusters);
      assert.ok(Array.isArray(queries));
      assert.ok(queries.length > 0);
    });
  });

  describe('spinWriter', () => {
    it('writeSpinResearchPacket creates all required files', () => {
      const result = writeSpinResearchPacket(TEST_SPIN, { spinsDir: tmpDir });
      const spinDir = path.join(tmpDir, 'spin_000001');

      assert.ok(fs.existsSync(path.join(spinDir, 'README.md')));
      assert.ok(fs.existsSync(path.join(spinDir, 'research.md')));
      assert.ok(fs.existsSync(path.join(spinDir, 'sources.json')));
      assert.ok(fs.existsSync(path.join(spinDir, 'equations.json')));
      assert.ok(fs.existsSync(path.join(spinDir, 'ontology.json')));
      assert.ok(fs.existsSync(path.join(spinDir, 'token.json')));
      assert.ok(fs.existsSync(path.join(spinDir, 'hashes.json')));
      assert.ok(fs.existsSync(path.join(spinDir, 'prompt.md')));
    });

    it('hashes.json contains all 4 hash fields', () => {
      const spinDir = path.join(tmpDir, 'spin_000001');
      const hashes = JSON.parse(fs.readFileSync(path.join(spinDir, 'hashes.json'), 'utf8'));
      assert.ok(hashes.hash1_article, 'hash1_article required');
      assert.ok(hashes.hash2_sources, 'hash2_sources required');
      assert.ok(hashes.hash3_research_package, 'hash3_research_package required');
      assert.ok(hashes.hash4_token_metadata, 'hash4_token_metadata required');
    });

    it('token.json has correct fields', () => {
      const spinDir = path.join(tmpDir, 'spin_000001');
      const token = JSON.parse(fs.readFileSync(path.join(spinDir, 'token.json'), 'utf8'));
      assert.equal(token.spin_id, 'spin_000001');
      assert.equal(token.type, 'Science');
      assert.equal(token.value, 100);
    });

    it('throws when trying to overwrite existing spin packet', () => {
      assert.throws(
        () => writeSpinResearchPacket(TEST_SPIN, { spinsDir: tmpDir }),
        /already exists/
      );
    });

    it('research.md article is at least 800 words', () => {
      const spinDir = path.join(tmpDir, 'spin_000001');
      const article = fs.readFileSync(path.join(spinDir, 'research.md'), 'utf8');
      const wordCount = article.split(/\s+/).length;
      assert.ok(wordCount >= 750, `Expected >= 750 words, got ${wordCount}`);
    });

    it('sources.json is a valid array with arXiv URL entries', () => {
      const spinDir = path.join(tmpDir, 'spin_000001');
      const sources = JSON.parse(fs.readFileSync(path.join(spinDir, 'sources.json'), 'utf8'));
      assert.ok(Array.isArray(sources));
      assert.ok(sources.length > 0);
      function isArxivUrl(url) {
        try {
          const h = new URL(url).hostname;
          return h === 'arxiv.org' || h.endsWith('.arxiv.org');
        } catch { return false; }
      }
      assert.ok(sources.some((s) => isArxivUrl(s.url)));
    });
  });
});
