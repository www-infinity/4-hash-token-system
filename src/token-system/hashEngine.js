'use strict';

const { createHash } = require('crypto');
const fs = require('fs');

/**
 * Generate a SHA-256 hex digest from a string or Buffer.
 * @param {string|Buffer} data
 * @returns {string} hex digest
 */
function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a file's contents with SHA-256.
 * @param {string} filePath
 * @returns {string} hex digest
 */
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return sha256(content);
}

/**
 * Hash multiple files by concatenating their contents with SHA-256.
 * @param {string[]} filePaths
 * @returns {string} hex digest
 */
function hashFiles(filePaths) {
  const combined = filePaths.map((p) => fs.readFileSync(p)).reduce((acc, buf) => Buffer.concat([acc, buf]), Buffer.alloc(0));
  return sha256(combined);
}

/**
 * Generate all 4 hashes for a token given its component file paths and metadata.
 *
 * HASH1 – article hash
 * HASH2 – sources hash
 * HASH3 – combined research package hash (article + sources)
 * HASH4 – token metadata hash
 *
 * @param {object} params
 * @param {string}   params.articlePath   path to article.md
 * @param {string}   params.sourcesPath   path to sources.txt or sources.json
 * @param {string[]} [params.extraPaths]  additional data/image files included in HASH3
 * @param {object}   params.metadata      token metadata object (id, value, type, date)
 * @returns {{ hash1: string, hash2: string, hash3: string, hash4: string }}
 */
function generateFourHashes({ articlePath, sourcesPath, extraPaths = [], metadata }) {
  const hash1 = hashFile(articlePath);
  const hash2 = hashFile(sourcesPath);

  const packageFiles = [articlePath, sourcesPath, ...extraPaths];
  const hash3 = hashFiles(packageFiles);

  const metaString = JSON.stringify({
    id: metadata.id,
    value: metadata.value,
    type: metadata.type,
    date: metadata.date,
  });
  const hash4 = sha256(metaString);

  return { hash1, hash2, hash3, hash4 };
}

module.exports = { sha256, hashFile, hashFiles, generateFourHashes };
