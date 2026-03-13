'use strict';

module.exports = {
  ...require('./token-system/index'),
  ...require('./token-system/verifier'),
  spinEngine: require('./spin-engine/research-writer/index'),
  auth: require('./auth/index'),
  treasury: require('./treasury/index'),
  receipts: require('./receipts/index'),
  distribution: require('./distribution/index'),
};
