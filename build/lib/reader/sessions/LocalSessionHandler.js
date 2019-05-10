"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appleVAS = require("apple-vas-data-decrypt");
const SessionUtils_1 = require("../SessionUtils");
const SessionUtils_2 = require("../SessionUtils");
const Logging_1 = require("../../Logging");
const smart_tap_1 = require("smart-tap");
const flomio_js_sdk_1 = require("flomio-js-sdk");
class LocalSessionHandler {
    constructor(config) {
        this.config = config;
        this.getDecrypter = () => {
            const key1 = this.config.nfc.keys.appleVAS.keys[0];
            const decrypter = appleVAS.makeDecrypter(this.config.nfc.selectPassTypeIdentifier, key1.privateKeyPem);
            return decrypter;
        };
    }
    get isLocal() {
        return true;
    }
    nfcConf() {
        return this.config.nfc.keys;
    }
    handleMessage(message) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            Logging_1.dbg('handling message', message);
            if (message.cmd === 0 /* select_ose */) {
                const key = this.nfcConf().googleSmartTap.keys[0];
                const session = new smart_tap_1.SecureSmartTapSession({
                    type: 'privateKey',
                    collectorId: this.config.nfc.selectCollectorId,
                    privateKey: {
                        version: key.version,
                        pem: key.privateKeyPem
                    }
                });
                yield session.selectOSECommand();
                // assume this has already been sorted
                const parsed = session.parseSelectOSEResponse(SessionUtils_1.fromBase64(message.args.response));
                Logging_1.dbg('found smart tap', JSON.stringify(parsed));
                if (parsed.isSmartTap) {
                    const negotiateCommand = yield session.negotiateSecureSessionCommand();
                    session.preEmptParse();
                    const getCommand = session.getSmartTapDataCommand();
                    return {
                        session: session,
                        cmd: 2 /* get_smart_tap_data */,
                        args: {
                            negotiate: SessionUtils_1.toBase64(negotiateCommand),
                            get: SessionUtils_1.toBase64(getCommand)
                        }
                    };
                    // TODO: this was commented in the original source on aws. why?
                    // return sendApdu(session, CommandKey.negotiate_session, session.negotiateSecureSessionCommand())
                }
                else {
                    return {
                        cmd: 11 /* get_vas_data */,
                        args: {
                            get: flomio_js_sdk_1.utils.unhex(SessionUtils_2.generateGVD(this.config.nfc.selectPassTypeIdentifier)).toString('base64')
                        }
                    };
                }
            }
            else if (message.cmd === 9 /* decrypt_smart_tap_data */) {
                Logging_1.dbg('decrypt_smart_tap_data');
                const session = message.session;
                Logging_1.dbg(JSON.stringify(session));
                message.args.responses.map((response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const apdu = SessionUtils_1.fromBase64(response);
                    Logging_1.dbg('parsed get st data resp apdu', apdu.slice(-2), apdu.length);
                    return session.parseGetSmartTapDataResponse(apdu);
                }));
                Logging_1.dbg('parseFullPayload');
                const fullPayload = yield session.parseFullPayload();
                const values = !!fullPayload ? smart_tap_1.getRedemptionValues(fullPayload) : [];
                Logging_1.dbg('values');
                Logging_1.dbg(values);
                return {
                    cmd: 10 /* decrypted_smart_tap_data */,
                    args: {
                        data: values
                    }
                };
            }
            else if (message.cmd === 12 /* decrypt_vas_data */) {
                const decrypter = this.getDecrypter();
                const decrypted = decrypter(SessionUtils_1.fromBase64(message.args.response));
                if (!decrypted.success) {
                    Logging_1.dbg(decrypted.error);
                }
                return {
                    cmd: 13 /* decrypted_vas_data */,
                    args: { data: decrypted.data }
                };
            }
            return null;
        });
    }
}
exports.LocalSessionHandler = LocalSessionHandler;
//# sourceMappingURL=LocalSessionHandler.js.map