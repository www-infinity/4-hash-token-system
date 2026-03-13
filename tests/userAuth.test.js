'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { encrypt, decrypt, registerUser, loginUser, addTokenToWallet, recordPlayHours } = require('../src/auth/userAuth');

const TEST_SECRET = 'test-secret-32-characters-minimum!!';

describe('userAuth', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'user-auth-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('encrypt / decrypt', () => {
    it('round-trips plaintext correctly', () => {
      const plain = 'hello world 🧱';
      const ciphertext = encrypt(plain, TEST_SECRET);
      assert.equal(decrypt(ciphertext, TEST_SECRET), plain);
    });

    it('produces different ciphertext each time (random IV)', () => {
      const plain = 'same input';
      const ct1 = encrypt(plain, TEST_SECRET);
      const ct2 = encrypt(plain, TEST_SECRET);
      assert.notEqual(ct1, ct2);
    });

    it('fails to decrypt with wrong secret', () => {
      const ciphertext = encrypt('secret data', TEST_SECRET);
      assert.throws(() => decrypt(ciphertext, 'wrong-secret-32-chars-minimum!!!'), /error|tag|auth/i);
    });
  });

  describe('registerUser', () => {
    it('creates an encrypted user profile file', async () => {
      await registerUser({ username: 'alice', password: 'pass123', secret: TEST_SECRET, usersDir: tmpDir });
      assert.ok(fs.existsSync(path.join(tmpDir, 'alice.enc')));
    });

    it('throws if user already exists', async () => {
      await assert.rejects(
        () => registerUser({ username: 'alice', password: 'other', secret: TEST_SECRET, usersDir: tmpDir }),
        /already exists/
      );
    });

    it('throws if required params are missing', async () => {
      await assert.rejects(() => registerUser({ username: '', password: 'x', secret: TEST_SECRET, usersDir: tmpDir }), /required/);
      await assert.rejects(() => registerUser({ username: 'bob', password: '', secret: TEST_SECRET, usersDir: tmpDir }), /required/);
    });
  });

  describe('loginUser', () => {
    it('returns profile without passwordHash on success', async () => {
      const profile = await loginUser({ username: 'alice', password: 'pass123', secret: TEST_SECRET, usersDir: tmpDir });
      assert.equal(profile.username, 'alice');
      assert.equal(profile.passwordHash, undefined);
      assert.ok(profile.createdAt);
    });

    it('throws on wrong password', async () => {
      await assert.rejects(
        () => loginUser({ username: 'alice', password: 'wrong', secret: TEST_SECRET, usersDir: tmpDir }),
        /Invalid credentials/
      );
    });

    it('throws on unknown user', async () => {
      await assert.rejects(
        () => loginUser({ username: 'nobody', password: 'pass', secret: TEST_SECRET, usersDir: tmpDir }),
        /Invalid credentials/
      );
    });
  });

  describe('addTokenToWallet', () => {
    it('adds a token to user wallet', async () => {
      const wallet = addTokenToWallet({
        username: 'alice',
        secret: TEST_SECRET,
        usersDir: tmpDir,
        token: { id: 1054, value: 2593, type: 'Research', hash4: 'abc' },
      });
      assert.equal(wallet.tokens.length, 1);
      assert.equal(wallet.tokens[0].id, 1054);
    });

    it('can add multiple tokens', async () => {
      addTokenToWallet({ username: 'alice', secret: TEST_SECRET, usersDir: tmpDir, token: { id: 2000, type: 'Science' } });
      const profile = await loginUser({ username: 'alice', password: 'pass123', secret: TEST_SECRET, usersDir: tmpDir });
      assert.equal(profile.wallet.tokens.length, 2);
    });
  });

  describe('recordPlayHours', () => {
    before(async () => {
      await registerUser({ username: 'bob', password: 'secure', secret: TEST_SECRET, usersDir: tmpDir });
    });

    it('increments tokenHours and awards tokens at 1 per hour', () => {
      const result = recordPlayHours({ username: 'bob', secret: TEST_SECRET, usersDir: tmpDir, hoursToAdd: 1 });
      assert.equal(result.tokensEarned, 1);
      assert.equal(result.hoursTotal, 1);
    });

    it('does not award a token for fractional hours', () => {
      const result = recordPlayHours({ username: 'bob', secret: TEST_SECRET, usersDir: tmpDir, hoursToAdd: 0.5 });
      assert.equal(result.tokensEarned, 0);
      assert.equal(result.hoursTotal, 1.5);
    });

    it('awards a token when crossing hour boundary', () => {
      const result = recordPlayHours({ username: 'bob', secret: TEST_SECRET, usersDir: tmpDir, hoursToAdd: 0.6 });
      assert.equal(result.tokensEarned, 1);
      assert.equal(result.hoursTotal, 2.1);
    });
  });
});
