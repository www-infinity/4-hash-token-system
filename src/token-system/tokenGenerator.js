'use strict';

const fs = require('fs');
const path = require('path');
const { generateFourHashes } = require('./hashEngine');

/** Emoji identifiers used in token display and metadata. */
const TOKEN_EMOJIS = {
  Research: '🧱',
  Discovery: '⭐',
  Economic: '💲',
  Science: '🧬',
  Machine: '⚙️',
  Archive: '📜',
};

/**
 * Return the emoji for a given token type, defaulting to 🧱.
 * @param {string} type
 * @returns {string}
 */
function emojiForType(type) {
  return TOKEN_EMOJIS[type] || '🧱';
}

/**
 * Build and persist a complete token folder.
 *
 * Directory layout:
 *   <tokensDir>/token_<id>/
 *     article.md
 *     sources.txt
 *     metadata.json
 *     hashes.json
 *
 * @param {object} params
 * @param {string|number} params.id           token ID
 * @param {number}        params.value        token value
 * @param {string}        params.type         token type (Research, Discovery, …)
 * @param {string}        [params.date]       ISO date string, defaults to today
 * @param {string}        params.articleText  markdown content for article.md
 * @param {string}        params.sourcesText  plain-text content for sources.txt
 * @param {string}        [params.tokensDir]  root directory for tokens, defaults to ./tokens
 * @returns {object}  complete token record including hashes
 */
function createToken({
  id,
  value,
  type = 'Research',
  date,
  articleText,
  sourcesText,
  tokensDir = path.join(process.cwd(), 'tokens'),
}) {
  const tokenDate = date || new Date().toISOString().slice(0, 10);
  const tokenDir = path.join(tokensDir, `token_${id}`);

  fs.mkdirSync(tokenDir, { recursive: true });

  const articlePath = path.join(tokenDir, 'article.md');
  const sourcesPath = path.join(tokenDir, 'sources.txt');
  const metadataPath = path.join(tokenDir, 'metadata.json');
  const hashesPath = path.join(tokenDir, 'hashes.json');

  fs.writeFileSync(articlePath, articleText, 'utf8');
  fs.writeFileSync(sourcesPath, sourcesText, 'utf8');

  const metadata = { id, value, type, date: tokenDate, emoji: emojiForType(type) };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  const { hash1, hash2, hash3, hash4 } = generateFourHashes({
    articlePath,
    sourcesPath,
    metadata,
  });

  const hashes = {
    hash1_article: hash1,
    hash2_sources: hash2,
    hash3_research_package: hash3,
    hash4_token_metadata: hash4,
  };
  fs.writeFileSync(hashesPath, JSON.stringify(hashes, null, 2), 'utf8');

  return { ...metadata, ...hashes, tokenDir };
}

/**
 * Build the human-readable token record string shown in documentation.
 * @param {object} token  result of createToken()
 * @returns {string}
 */
function formatTokenRecord(token) {
  return [
    `${emojiForType(token.type)}${emojiForType(token.type)}${emojiForType(token.type)} TOKEN`,
    '',
    `ID: ${token.id}`,
    `Value: ${token.value}`,
    `Type: ${token.type}`,
    `Date: ${token.date}`,
    '',
    'HASH1_ARTICLE:',
    token.hash1_article,
    '',
    'HASH2_SOURCES:',
    token.hash2_sources,
    '',
    'HASH3_RESEARCH_PACKAGE:',
    token.hash3_research_package,
    '',
    'HASH4_TOKEN_METADATA:',
    token.hash4_token_metadata,
  ].join('\n');
}

module.exports = { createToken, formatTokenRecord, emojiForType, TOKEN_EMOJIS };
