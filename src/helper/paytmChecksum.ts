'use strict';

import * as crypto from 'crypto';
import { Any } from 'typeorm';

export class PaytmChecksum {
  static iv: string;

  static encrypt(input, key) {
    const cipher = crypto.createCipheriv('AES-128-CBC', key, PaytmChecksum.iv);
    let encrypted = cipher.update(input, 'binary', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  static decrypt(encrypted, key) {
    const decipher = crypto.createDecipheriv(
      'AES-128-CBC',
      key,
      PaytmChecksum.iv,
    );
    let decrypted = decipher.update(encrypted, 'base64', 'binary');
    try {
      decrypted += decipher.final('binary');
    } catch (e) {}
    return decrypted;
  }

  static generateSignature(params, key) {
    if (typeof params !== 'object' && typeof params !== 'string') {
      const error = 'string or object expected, ' + typeof params + ' given.';
      return Promise.reject(error);
    }
    if (typeof params !== 'string') {
      params = PaytmChecksum.getStringByParams(params);
    }
    return PaytmChecksum.generateSignatureByString(params, key);
  }

  static async verifySignature(params, key, checksum) {
    if (typeof params !== 'object' && typeof params !== 'string') {
      const error = 'string or object expected, ' + typeof params + ' given.';
      return Promise.reject(error);
    }
    if (params.hasOwnProperty('CHECKSUMHASH')) {
      delete params.CHECKSUMHASH;
    }
    if (typeof params !== 'string') {
      params = PaytmChecksum.getStringByParams(params);
    }
    const resToSend = await PaytmChecksum.verifySignatureByString(
      params,
      key,
      checksum,
    );
    return resToSend;
  }

  static async generateSignatureByString(params, key) {
    const salt = await PaytmChecksum.generateRandomString(4);
    return PaytmChecksum.calculateChecksum(params, key, salt);
  }

  static async verifySignatureByString(params, key, checksum) {
    const paytm_hash = await PaytmChecksum.decrypt(checksum, key);

    const salt = paytm_hash.substr(paytm_hash.length - 4);

    const newHash = await PaytmChecksum.calculateHash(params, salt);

    return paytm_hash === newHash;
  }

  static generateRandomString(length) {
    return new Promise(function (resolve, reject) {
      crypto.randomBytes((length * 3.0) / 4.0, function (err, buf) {
        if (!err) {
          const salt = buf.toString('base64');
          resolve(salt);
        } else {
          reject(err);
        }
      });
    });
  }

  static getStringByParams(params) {
    const data = {};
    Object.keys(params)
      .sort()
      .forEach(function (key, value) {
        data[key] =
          params[key] !== null && params[key].toLowerCase() !== 'null'
            ? params[key]
            : '';
      });
    return Object.values(data).join('|');
  }

  static calculateHash(params, salt) {
    const finalString = params + '|' + salt;
    return crypto.createHash('sha256').update(finalString).digest('hex') + salt;
  }

  static calculateChecksum(params, key, salt) {
    const hashString = PaytmChecksum.calculateHash(params, salt);
    return PaytmChecksum.encrypt(hashString, key);
  }
}
PaytmChecksum.iv = '@@@@&&&&####$$$$';
