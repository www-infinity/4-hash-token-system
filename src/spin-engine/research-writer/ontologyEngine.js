'use strict';

const path = require('path');
const fs = require('fs');

const SEED_PATH = path.join(__dirname, '../data/science_seed_1000.json');

/**
 * Load the science seed ontology.
 * @returns {object} domain → terms map
 */
function loadSeedOntology() {
  return JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
}

/**
 * Load the grown ontology from ontology_growth.json, if it exists.
 * @param {string} growthPath
 * @returns {object[]} array of growth entries
 */
function loadGrowthOntology(growthPath) {
  if (!fs.existsSync(growthPath)) return [];
  return JSON.parse(fs.readFileSync(growthPath, 'utf8'));
}

/**
 * Return a flat array of all seed terms.
 * @returns {string[]}
 */
function allSeedTerms() {
  const seed = loadSeedOntology();
  return Object.values(seed).flat();
}

/**
 * Match spin symbols against the seed ontology and return the most relevant
 * terms and their parent domains.
 *
 * @param {string[]} symbols  words / phrases from the spin
 * @param {number}  [limit]   max terms to return per domain
 * @returns {{ matchedTerms: string[], domainScores: object }}
 */
function matchSymbolsToOntology(symbols, limit = 5) {
  const seed = loadSeedOntology();
  const lowerSymbols = symbols.map((s) => s.toLowerCase());
  const domainScores = {};
  const matchedTerms = [];

  for (const [domain, terms] of Object.entries(seed)) {
    const hits = terms.filter((t) =>
      lowerSymbols.some(
        (s) => t.toLowerCase().includes(s) || s.includes(t.toLowerCase().split(' ')[0])
      )
    );
    if (hits.length > 0) {
      domainScores[domain] = hits.length;
      matchedTerms.push(...hits.slice(0, limit));
    }
  }

  return { matchedTerms, domainScores };
}

/**
 * Build topic clusters from matched terms and symbols.
 * @param {string[]} symbols
 * @param {string[]} matchedTerms
 * @returns {string[]}
 */
function buildTopicClusters(symbols, matchedTerms) {
  const clusters = new Set();
  for (const s of symbols) {
    clusters.add(s.toLowerCase());
  }
  for (const t of matchedTerms.slice(0, 8)) {
    clusters.add(t.toLowerCase());
  }
  return [...clusters].slice(0, 6);
}

/**
 * Suggest next-step arXiv / web queries from topic clusters.
 * @param {string[]} clusters
 * @returns {string[]}
 */
function buildNextQueries(clusters) {
  const pairs = [];
  for (let i = 0; i < clusters.length - 1; i++) {
    pairs.push(`${clusters[i]} ${clusters[i + 1]}`);
  }
  return pairs.slice(0, 5);
}

/**
 * Add new terms to ontology_growth.json (append-only, no duplicates).
 *
 * @param {object[]} newTerms  array of { term, source, date, confidence, parentCluster }
 * @param {string}   growthPath
 */
function addToGrowthOntology(newTerms, growthPath) {
  const existing = loadGrowthOntology(growthPath);
  const existingTermSet = new Set(existing.map((e) => e.term));
  const toAdd = newTerms.filter((n) => !existingTermSet.has(n.term));
  const updated = [...existing, ...toAdd];
  fs.writeFileSync(growthPath, JSON.stringify(updated, null, 2), 'utf8');
  return toAdd.length;
}

module.exports = {
  loadSeedOntology,
  loadGrowthOntology,
  allSeedTerms,
  matchSymbolsToOntology,
  buildTopicClusters,
  buildNextQueries,
  addToGrowthOntology,
};
