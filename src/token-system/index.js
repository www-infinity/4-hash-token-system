'use strict';

const { sha256, hashFile, hashFiles, generateFourHashes } = require('./hashEngine');
const { createToken, formatTokenRecord, emojiForType, TOKEN_EMOJIS } = require('./tokenGenerator');
const { appendToLedger, readLedger, renderLedger } = require('./ledger');
const { verifyToken, verifyTokenReport } = require('./verifier');

module.exports = {
  sha256,
  hashFile,
  hashFiles,
  generateFourHashes,
  createToken,
  formatTokenRecord,
  emojiForType,
  TOKEN_EMOJIS,
  appendToLedger,
  readLedger,
  renderLedger,
  verifyToken,
  verifyTokenReport,
};
