
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError(\"Generator is already executing.\");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var messages_1 = __webpack_require__(/*! ../../messages */ \"./src/services/readers/messages.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../../../../injection-tokens */ \"./src/injection-tokens.ts\");
var abstract_session_handler_service_1 = __webpack_require__(/*! ../abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");
var session_utils_1 = __webpack_require__(/*! ../../session-utils */ \"./src/services/readers/session-utils.ts\");
var smart_tap_1 = __webpack_require__(/*! smart-tap */ \"../smart-tap/dist/index.js\");
var logging_1 = __webpack_require__(/*! ../../../../logging */ \"./src/logging.ts\");
var readers_service_1 = __webpack_require__(/*! ../../readers.service */ \"./src/services/readers/readers.service.ts\");
var utils_1 = __webpack_require__(/*! flomio-js-sdk-pcsc/dist/utils */ \"../flomio-js-sdk-pcsc/dist/utils.js\");
var apple_vas_data_decrypt_1 = __webpack_require__(/*! apple-vas-data-decrypt */ \"../apple-vas-data-decrypt/dist/index.js\");
var LocalSessionHandlerService = /** @class */ (function (_super) {
    __extends(LocalSessionHandlerService, _super);
    function LocalSessionHandlerService(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        return _this;
    }
    LocalSessionHandlerService.prototype.handleMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var key, session, parsed, negotiateCommand, getCommand, session, _i, _a, response, apdu, fullPayload, values, decrypter, decrypted;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logging_1.trc('handling message', message);
                        if (!(message.cmd === messages_1.CommandKey.select_ose)) return [3 /*break*/, 7];
                        key = this.nfcConf().googleSmartTap.keys[0];
                        session = new smart_tap_1.SecureSmartTapSession({
                            type: 'privateKey',
                            collectorId: this.config.nfc.selectCollectorId,
                            privateKey: {
                                version: key.version,
                                pem: key.privateKeyPem
                            }
                        });
                        // assume this has already been sorted
                        return [4 /*yield*/, session.selectOSECommand()
                            // await session.selectOSECommand()
                            // await session.selectOSECommand()
                        ];
                    case 1:
                        // assume this has already been sorted
                        _b.sent();
                        return [4 /*yield*/, session.parseSelectOSEResponse(session_utils_1.fromBase64(message.args.response))];
                    case 2:
                        parsed = _b.sent();
                        logging_1.trc('found smart tap', JSON.stringify(parsed));
                        if (!parsed.isSmartTap) return [3 /*break*/, 5];
                        return [4 /*yield*/, session.negotiateSecureSessionCommand()];
                    case 3:
                        negotiateCommand = _b.sent();
                        session.preEmptParse();
                        return [4 /*yield*/, session.getSmartTapDataCommand()];
                    case 4:
                        getCommand = _b.sent();
                        return [2 /*return*/, {
                                session: session,
                                cmd: messages_1.CommandKey.get_smart_tap_data,
                                args: { negotiate: session_utils_1.toBase64(negotiateCommand), get: session_utils_1.toBase64(getCommand) }
                            }
                            // return sendApdu(session, CommandKey.negotiate_session, session.negotiateSecureSessionCommand())
                        ];
                    case 5: return [2 /*return*/, {
                            cmd: messages_1.CommandKey.get_vas_data,
                            args: { get: utils_1.unhex(readers_service_1.generateGVD(this.config.nfc.selectPassTypeIdentifier))
                                    .toString('base64') }
                        }];
                    case 6: return [3 /*break*/, 14];
                    case 7:
                        if (!(message.cmd === messages_1.CommandKey.decrypt_smart_tap_data)) return [3 /*break*/, 13];
                        session = message.session;
                        _i = 0, _a = message.args.responses;
                        _b.label = 8;
                    case 8:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        response = _a[_i];
                        apdu = session_utils_1.fromBase64(response);
                        logging_1.trc('parsed get st data resp apdu', apdu.slice(-2), apdu.length);
                        return [4 /*yield*/, session.parseGetSmartTapDataResponse(apdu)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 8];
                    case 11: return [4 /*yield*/, session.parseFullPayload()];
                    case 12:
                        fullPayload = _b.sent();
                        values = !!fullPayload ? smart_tap_1.getRedemptionValues(fullPayload) : [];
                        return [2 /*return*/, {
                                cmd: messages_1.CommandKey.decrypted_smart_tap_data,
                                args: {
                                    data: values
                                }
                            }];
                    case 13:
                        if (message.cmd === messages_1.CommandKey.decrypt_vas_data) {
                            decrypter = this.getDecrypter();
                            decrypted = decrypter(session_utils_1.fromBase64(message.args.response));
                            if (!decrypted.success) {
                                console.log(decrypted.error);
                            }
                            return [2 /*return*/, {
                                    cmd: messages_1.CommandKey.decrypted_vas_data,
                                    args: { data: (decrypted.data) },
                                }];
                        }
                        _b.label = 14;
                    case 14: return [2 /*return*/, null];
                }
            });
        });
    };
    LocalSessionHandlerService.prototype.nfcConf = function () {
        return this.config.nfc.keys;
    };
    // TODO: cache
    // TODO: find the key that matches passTypeIdentifier
    LocalSessionHandlerService.prototype.getDecrypter = function () {
        var key1 = this.config.nfc.keys.appleVAS.keys[0];
        var decrypter = apple_vas_data_decrypt_1.makeDecrypter(this.config.nfc.selectPassTypeIdentifier, key1.privateKeyPem);
        return decrypter;
    };
    LocalSessionHandlerService.prototype.isLocal = function () {
        return true;
    };
    LocalSessionHandlerService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object])
    ], LocalSessionHandlerService);
    return LocalSessionHandlerService;
}(abstract_session_handler_service_1.SessionHandlerService));
exports.LocalSessionHandlerService = LocalSessionHandlerService;


//# sourceURL=webpack://commonjs/./src/services/readers/sessions/local/local-session-handler.service.ts?"