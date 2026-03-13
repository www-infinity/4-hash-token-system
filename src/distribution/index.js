'use strict';

const { getNextTreasuryToken, distributeFromTreasury } = require('../treasury/index');
const { issueReceipt } = require('../receipts/index');

const ONE_HOUR_MS = 3_600_000;

/**
 * Apply the distribution rule: one token per hour per wallet.
 *
 * If the wallet is eligible (last_token_time is more than one hour ago or
 * has never received a token), the next available treasury token is moved
 * to the wallet. Otherwise a receipt is issued proving the spin occurred.
 *
 * @param {object} params
 * @param {object} params.wallet            wallet record
 * @param {string} params.wallet.wallet_id  wallet identifier
 * @param {string[]} params.wallet.tokens   array of token IDs in this wallet
 * @param {number|null} params.wallet.last_token_time  ms timestamp or null
 * @param {string} params.spinId            spin that triggered this distribution attempt
 * @param {string} [params.treasuryPath]    path to treasury/ledger.json
 * @param {string} [params.receiptsDir]     directory for receipt files
 * @returns {{ wallet: object, tokenDistributed: boolean, tokenId: string|null, receipt: object|null }}
 */
function distributeToken({ wallet, spinId, treasuryPath, receiptsDir }) {
  const now = Date.now();
  const lastTime = wallet.last_token_time || 0;
  const eligible = now - lastTime > ONE_HOUR_MS;

  if (eligible) {
    const tokenId = getNextTreasuryToken(treasuryPath);

    if (!tokenId) {
      // Treasury is empty — issue receipt instead
      const receipt = issueReceipt({ spinId, walletId: wallet.wallet_id, tokenAwarded: false, receiptsDir });
      return { wallet, tokenDistributed: false, tokenId: null, receipt };
    }

    distributeFromTreasury(tokenId, wallet.wallet_id, treasuryPath);

    const updatedWallet = {
      ...wallet,
      tokens: [...(wallet.tokens || []), tokenId],
      last_token_time: now,
    };

    const receipt = issueReceipt({ spinId, walletId: wallet.wallet_id, tokenAwarded: true, receiptsDir });

    return { wallet: updatedWallet, tokenDistributed: true, tokenId, receipt };
  }

  // Not yet eligible — issue a receipt only
  const receipt = issueReceipt({ spinId, walletId: wallet.wallet_id, tokenAwarded: false, receiptsDir });
  return { wallet, tokenDistributed: false, tokenId: null, receipt };
}

module.exports = { distributeToken, ONE_HOUR_MS };
