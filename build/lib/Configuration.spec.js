"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Configuration_1 = require("./Configuration");
var path = require("path");
describe('nfc keys', function () {
    var pathToKeys = path.resolve(__dirname, 'pn-nfc-keys.json');
    it('getNfcKeys should not throw when reading file', function () {
        expect(function () { return Configuration_1.getNfc(pathToKeys); }).not.toThrow();
    });
    it('should return properly formed keys', function () {
        expect(Configuration_1.isNfc(Configuration_1.getNfc(pathToKeys))).toEqual(true);
    });
});
describe('Configuration', function () {
    it('should build without throwing errors', function () {
        expect(function () { return new Configuration_1.Configuration(); }).not.toThrow();
    });
});
//# sourceMappingURL=Configuration.spec.js.map