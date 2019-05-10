"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthorizationService_1 = require("./AuthorizationService");
const Reader_1 = require("./reader/Reader");
const LocalSessionHandler_1 = require("./reader/sessions/LocalSessionHandler");
const fs = require("fs");
const nfcKeys = process.env.PN_NFC_KEYS && fs.existsSync(process.env.PN_NFC_KEYS) ?
    JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString()) : undefined;
exports.configure = (program) => {
    const auth = new AuthorizationService_1.AuthorizationService();
    const config = {
        nfc: {
            // PassNinjaDemo
            selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
            selectCollectorId: 77501435,
            keys: nfcKeys
        }
    };
    const localSession = new LocalSessionHandler_1.LocalSessionHandler(config);
    const readerSession = new Reader_1.Reader(localSession, config);
    readerSession.start();
};
//# sourceMappingURL=configure.js.map