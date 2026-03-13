'use strict';

const { registerUser, loginUser, addTokenToWallet, recordPlayHours, encrypt, decrypt } = require('./userAuth');

module.exports = { registerUser, loginUser, addTokenToWallet, recordPlayHours, encrypt, decrypt };
