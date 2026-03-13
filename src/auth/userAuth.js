'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;
const ALGORITHM = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 16;
const TAG_LEN = 16;
const SALT_LEN = 32;

/**
 * Derive a 32-byte AES key from the provided secret using PBKDF2.
 * @param {string} secret
 * @param {Buffer} salt
 * @returns {Buffer}
 */
function deriveKey(secret, salt) {
  return crypto.pbkdf2Sync(secret, salt, 210000, KEY_LEN, 'sha256');
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns a single hex string: salt || iv || authTag || ciphertext
 *
 * @param {string} plaintext
 * @param {string} secret   encryption secret (from environment, never from user input)
 * @returns {string} hex-encoded payload
 */
function encrypt(plaintext, secret) {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(secret, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

/**
 * Decrypt a hex payload produced by encrypt().
 * @param {string} hexPayload
 * @param {string} secret
 * @returns {string} plaintext
 */
function decrypt(hexPayload, secret) {
  const buf = Buffer.from(hexPayload, 'hex');
  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = buf.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(SALT_LEN + IV_LEN + TAG_LEN);

  const key = deriveKey(secret, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * Return the file path for a user's encrypted profile.
 * @param {string} usersDir
 * @param {string} username
 * @returns {string}
 */
function userFilePath(usersDir, username) {
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(usersDir, `${safe}.enc`);
}

/**
 * Register a new user.
 *
 * Stores an AES-256-GCM encrypted JSON file containing:
 *   { username, passwordHash, createdAt, wallet, tokenHours }
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.password      plaintext password (hashed with bcrypt before storage)
 * @param {string} params.secret        AES encryption secret (from ENCRYPTION_SECRET env var)
 * @param {string} [params.usersDir]    directory for user profile files (default ./users)
 * @returns {{ username: string, createdAt: string }}
 */
async function registerUser({ username, password, secret, usersDir = path.join(process.cwd(), 'users') }) {
  if (!username || !password || !secret) {
    throw new Error('username, password, and secret are required');
  }

  fs.mkdirSync(usersDir, { recursive: true });

  const filePath = userFilePath(usersDir, username);
  if (fs.existsSync(filePath)) {
    throw new Error(`User '${username}' already exists`);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const createdAt = new Date().toISOString();

  const profile = {
    username,
    passwordHash,
    createdAt,
    wallet: { tokens: [], tokenHours: 0 },
  };

  const ciphertext = encrypt(JSON.stringify(profile), secret);
  fs.writeFileSync(filePath, ciphertext, 'utf8');

  return { username, createdAt };
}

/**
 * Authenticate a user. Returns the decrypted profile on success.
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.password
 * @param {string} params.secret
 * @param {string} [params.usersDir]
 * @returns {object} decrypted user profile (without passwordHash)
 */
async function loginUser({ username, password, secret, usersDir = path.join(process.cwd(), 'users') }) {
  if (!username || !password || !secret) {
    throw new Error('username, password, and secret are required');
  }

  const filePath = userFilePath(usersDir, username);
  if (!fs.existsSync(filePath)) {
    throw new Error('Invalid credentials');
  }

  let profile;
  try {
    const ciphertext = fs.readFileSync(filePath, 'utf8');
    profile = JSON.parse(decrypt(ciphertext, secret));
  } catch {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, profile.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const { passwordHash: _removed, ...safeProfile } = profile;
  return safeProfile;
}

/**
 * Add a token to a user's wallet.
 * The user's profile is read, updated, and re-encrypted atomically.
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.secret
 * @param {object} params.token     token record to add
 * @param {string} [params.usersDir]
 * @returns {object} updated wallet
 */
function addTokenToWallet({ username, secret, token, usersDir = path.join(process.cwd(), 'users') }) {
  const filePath = userFilePath(usersDir, username);
  if (!fs.existsSync(filePath)) {
    throw new Error(`User '${username}' not found`);
  }

  const ciphertext = fs.readFileSync(filePath, 'utf8');
  const profile = JSON.parse(decrypt(ciphertext, secret));

  profile.wallet.tokens.push({ ...token, addedAt: new Date().toISOString() });

  fs.writeFileSync(filePath, encrypt(JSON.stringify(profile), secret), 'utf8');
  return profile.wallet;
}

/**
 * Increment the play-hours counter for a user and award a token if one is due.
 * Users earn 1 token per hour of play.
 *
 * @param {object} params
 * @param {string} params.username
 * @param {string} params.secret
 * @param {number} [params.hoursToAdd]   defaults to 1
 * @param {string} [params.usersDir]
 * @returns {{ hoursTotal: number, tokensEarned: number }}
 */
function recordPlayHours({ username, secret, hoursToAdd = 1, usersDir = path.join(process.cwd(), 'users') }) {
  const filePath = userFilePath(usersDir, username);
  if (!fs.existsSync(filePath)) {
    throw new Error(`User '${username}' not found`);
  }

  const ciphertext = fs.readFileSync(filePath, 'utf8');
  const profile = JSON.parse(decrypt(ciphertext, secret));

  const previousHours = profile.wallet.tokenHours || 0;
  const newHours = previousHours + hoursToAdd;
  const tokensEarned = Math.floor(newHours) - Math.floor(previousHours);

  profile.wallet.tokenHours = newHours;

  if (tokensEarned > 0) {
    for (let i = 0; i < tokensEarned; i++) {
      profile.wallet.tokens.push({
        type: 'PlayReward',
        emoji: '⭐',
        awardedAt: new Date().toISOString(),
        reason: '1 hour of play',
      });
    }
  }

  fs.writeFileSync(filePath, encrypt(JSON.stringify(profile), secret), 'utf8');
  return { hoursTotal: newHours, tokensEarned };
}

module.exports = {
  registerUser,
  loginUser,
  addTokenToWallet,
  recordPlayHours,
  encrypt,
  decrypt,
};
