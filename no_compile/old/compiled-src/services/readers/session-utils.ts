
Object.defineProperty(exports, \"__esModule\", { value: true });
function fromBase64(buffer) {
    return Buffer.from(buffer, 'base64');
}
exports.fromBase64 = fromBase64;
function toBase64(buf) {
    return buf.toString('base64');
}
exports.toBase64 = toBase64;
function apduRespB64(resp) {
    return resp.full.toString('base64');
}
exports.apduRespB64 = apduRespB64;


//# sourceURL=webpack://commonjs/./src/services/readers/session-utils.ts?"