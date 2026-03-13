'use strict';

const { writeSpinResearchPacket, generateResearchArticle, generateSources, generateEquations } = require('./spinWriter');
const {
  loadSeedOntology,
  loadGrowthOntology,
  allSeedTerms,
  matchSymbolsToOntology,
  buildTopicClusters,
  buildNextQueries,
  addToGrowthOntology,
} = require('./ontologyEngine');

module.exports = {
  writeSpinResearchPacket,
  generateResearchArticle,
  generateSources,
  generateEquations,
  loadSeedOntology,
  loadGrowthOntology,
  allSeedTerms,
  matchSymbolsToOntology,
  buildTopicClusters,
  buildNextQueries,
  addToGrowthOntology,
};
