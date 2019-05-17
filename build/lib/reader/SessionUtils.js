"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function generateGVD(passTypeIdentifier) {
    return ('80CA0101369F220201009F2520' +
        createSha256(passTypeIdentifier) +
        '9F2804C' +
        '5266B6E9F260400000002');
}
exports.generateGVD = generateGVD;
function createSha256(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest()
        .toString('hex')
        .toUpperCase();
}
exports.toBase64 = (buffer) => {
    return buffer.toString('base64');
};
exports.fromBase64 = (str) => {
    return Buffer.from(str, 'base64');
};
//# sourceMappingURL=SessionUtils.js.map