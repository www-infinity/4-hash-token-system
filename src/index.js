'use strict';

module.exports = {
  ...require('./token-system/index'),
  spinEngine: require('./spin-engine/research-writer/index'),
  auth: require('./auth/index'),
};
