'use strict';

exports.generateHash = function (password) {
    let pbkdf2 = require('pbkdf2');

    let derivedKey = pbkdf2.pbkdf2Sync(password, 'salt', 1, 32, 'sha512');
    return derivedKey.toString('hex');
};
