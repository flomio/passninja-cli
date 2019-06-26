"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var appleVAS = require("apple-vas-data-decrypt");
var utils_1 = require("./utils");
var Logging_1 = require("../no_compile/Logging");
var smart_tap_1 = require("smart-tap");
var flomio_js_sdk_1 = require("flomio-js-sdk");
var SessionHandler = /** @class */ (function () {
    function SessionHandler(config) {
        var _this = this;
        this.config = config;
        this.getDecrypter = function () {
            var key1 = _this.config.nfc.keys.appleVAS.keys[0];
            var decrypter = appleVAS.makeDecrypter(_this.config.nfc.selectPassTypeIdentifier, key1.privateKeyPem);
            return decrypter;
        };
    }
    Object.defineProperty(SessionHandler.prototype, "isLocal", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    SessionHandler.prototype.nfcConf = function () {
        return this.config.nfc.keys;
    };
    SessionHandler.prototype.handleMessage = function (message) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var key, session, parsed, negotiateCommand, getCommand, session_1, fullPayload, values, decrypter, decrypted;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Logging_1.dbg('handling message', message);
                        if (!(message.cmd === 0 /* select_ose */)) return [3 /*break*/, 5];
                        key = this.nfcConf().googleSmartTap.keys[0];
                        session = new smart_tap_1.SecureSmartTapSession({
                            type: 'privateKey',
                            collectorId: this.config.nfc.selectCollectorId,
                            privateKey: {
                                version: key.version,
                                pem: key.privateKeyPem
                            }
                        });
                        return [4 /*yield*/, session.selectOSECommand()];
                    case 1:
                        _a.sent();
                        parsed = session.parseSelectOSEResponse(utils_1.fromBase64(message.args.response));
                        Logging_1.dbg('found smart tap', JSON.stringify(parsed));
                        if (!parsed.isSmartTap) return [3 /*break*/, 3];
                        return [4 /*yield*/, session.negotiateSecureSessionCommand()];
                    case 2:
                        negotiateCommand = _a.sent();
                        session.preEmptParse();
                        getCommand = session.getSmartTapDataCommand();
                        return [2 /*return*/, {
                                session: session,
                                cmd: 2 /* get_smart_tap_data */,
                                args: {
                                    negotiate: utils_1.toBase64(negotiateCommand),
                                    get: utils_1.toBase64(getCommand)
                                }
                            }];
                    case 3: return [2 /*return*/, {
                            cmd: 11 /* get_vas_data */,
                            args: {
                                get: flomio_js_sdk_1.utils
                                    .unhex(utils_1.generateGVD(this.config.nfc.selectPassTypeIdentifier))
                                    .toString('base64')
                            }
                        }];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        if (!(message.cmd === 9 /* decrypt_smart_tap_data */)) return [3 /*break*/, 7];
                        Logging_1.dbg('decrypt_smart_tap_data');
                        session_1 = message.session;
                        Logging_1.dbg(JSON.stringify(session_1));
                        message.args.responses.map(function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var apdu;
                            return tslib_1.__generator(this, function (_a) {
                                apdu = utils_1.fromBase64(response);
                                Logging_1.dbg('parsed get st data resp apdu', apdu.slice(-2), apdu.length);
                                return [2 /*return*/, session_1.parseGetSmartTapDataResponse(apdu)];
                            });
                        }); });
                        Logging_1.dbg('parseFullPayload');
                        return [4 /*yield*/, session_1.parseFullPayload()];
                    case 6:
                        fullPayload = _a.sent();
                        values = !!fullPayload ? smart_tap_1.getRedemptionValues(fullPayload) : [];
                        Logging_1.dbg('values');
                        Logging_1.dbg(values);
                        return [2 /*return*/, {
                                cmd: 10 /* decrypted_smart_tap_data */,
                                args: {
                                    data: values
                                }
                            }];
                    case 7:
                        if (message.cmd === 12 /* decrypt_vas_data */) {
                            decrypter = this.getDecrypter();
                            decrypted = decrypter(utils_1.fromBase64(message.args.response));
                            if (!decrypted.success) {
                                Logging_1.dbg(decrypted.error);
                            }
                            return [2 /*return*/, {
                                    cmd: 13 /* decrypted_vas_data */,
                                    args: { data: decrypted.data }
                                }];
                        }
                        _a.label = 8;
                    case 8: return [2 /*return*/, null];
                }
            });
        });
    };
    return SessionHandler;
}());
exports.SessionHandler = SessionHandler;
//# sourceMappingURL=SessionHandler.js.map