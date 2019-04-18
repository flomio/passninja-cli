
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var pcsc = __importStar(__webpack_require__(/*! flomio-js-sdk-pcsc */ \"../flomio-js-sdk-pcsc/dist/index.js\"));
var event_bus_1 = __webpack_require__(/*! ../event-bus */ \"./src/services/event-bus.ts\");
var session_utils_1 = __webpack_require__(/*! ./session-utils */ \"./src/services/readers/session-utils.ts\");
var messages_1 = __webpack_require__(/*! ./messages */ \"./src/services/readers/messages.ts\");
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var utils_1 = __webpack_require__(/*! ./utils */ \"./src/services/readers/utils.ts\");
var events_1 = __webpack_require__(/*! ../../events */ \"./src/events.ts\");
var abstract_session_handler_service_1 = __webpack_require__(/*! ./sessions/abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");
var uuid = __importStar(__webpack_require__(/*! uuid */ \"./node_modules/uuid/index.js\"));
var crypto = __importStar(__webpack_require__(/*! crypto */ \"crypto\"));
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
var utils_2 = __webpack_require__(/*! flomio-js-sdk-pcsc/dist/utils */ \"../flomio-js-sdk-pcsc/dist/utils.js\");
var environment_service_1 = __webpack_require__(/*! ../env/environment.service */ \"./src/services/env/environment.service.ts\");
function createSha256(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest()
        .toString('hex')
        .toUpperCase();
}
function generateGVD(passTypeIdentifier) {
    return '80CA0101369F220201009F2520' +
        createSha256(passTypeIdentifier) +
        '9F2804C' +
        '5266B6E9F260400000002';
}
exports.generateGVD = generateGVD;
var ReadersService = /** @class */ (function () {
    function ReadersService(config, events, env, readerSession) {
        this.config = config;
        this.events = events;
        this.env = env;
        this.readerSession = readerSession;
    }
    ReadersService.prototype.start = function () {
        var connectionMode = this.env.platform() === 'win32' ?
            'shared' : 'exclusive';
        logging_1.dbg('Creating pcsc.Session with', { connectionMode: connectionMode });
        var session = this.session = new pcsc.Session({
            connectionMode: connectionMode
        });
        session.on('reader', this.onReader.bind(this));
    };
    ReadersService.prototype.onTag = function (reader, tag) {
        // TODO: handle unknown tags and pray
        if (tag.type == 'hceDevice') {
            return this.onHceDevice(reader, tag);
        }
    };
    ReadersService.prototype.onReader = function (reader) {
        return __awaiter(this, void 0, void 0, function () {
            var spec, withSpec;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.initReaderAndGetSpec(reader)];
                    case 1:
                        spec = _a.sent();
                        logging_1.dbg('Found reader', spec);
                        withSpec = { reader: reader, spec: spec };
                        reader.on('tagScanned', this.onTag.bind(this, withSpec));
                        return [2 /*return*/];
                }
            });
        });
    };
    ReadersService.prototype.onHceDevice = function (reader, tag) {
        return __awaiter(this, void 0, void 0, function () {
            var selected, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.selectOSE(tag)];
                    case 1:
                        selected = _a.sent();
                        if (!selected.OK) {
                            // TODO: more info! typed events!
                            this.events.emit(events_1.Events.errorSelectOse, {
                                SW: selected.SW
                            });
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        if (!selected.data.toString().includes('ApplePay')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.onApplePay(tag, reader)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.onSmartTap(selected, tag, reader)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        logging_1.dbg('Scan error', e_1);
                        this.eject(reader.reader);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ReadersService.prototype.onSmartTap = function (selectResp, tag, readerWithSpec) {
        return __awaiter(this, void 0, void 0, function () {
            var reader, selectOSEMsg, resp, responses, negotiateApdu, negotiateResp, tackyTag, apdu, apduResp, rem, serializedOrLiveSession, id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.readerSession.isLocal() || this.readerSession.isLocal())) return [3 /*break*/, 2];
                        logging_1.dbg('Double selecting to delay');
                        return [4 /*yield*/, utils_1.selectOSE(tag)];
                    case 1:
                        selectResp = _a.sent();
                        _a.label = 2;
                    case 2:
                        reader = readerWithSpec.reader;
                        selectOSEMsg = {
                            cmd: messages_1.CommandKey.select_ose,
                            args: {
                                // TODO: seems senseless to encode as string when session handler
                                // is running locally
                                response: selectResp.full.toString('base64'),
                                passTypeIdentifier: this.config.nfc.selectPassTypeIdentifier,
                                collectorId: this.config.nfc.selectCollectorId,
                            }
                        };
                        return [4 /*yield*/, this.readerSession.handleMessage(selectOSEMsg)];
                    case 3:
                        resp = _a.sent();
                        logging_1.trc('Select', resp);
                        responses = [];
                        if (!(resp.cmd == messages_1.CommandKey.get_smart_tap_data)) return [3 /*break*/, 10];
                        negotiateApdu = session_utils_1.fromBase64(resp.args.negotiate);
                        logging_1.trc('Negotiate apdu', negotiateApdu.length);
                        return [4 /*yield*/, tag.sendAPDU(negotiateApdu)];
                    case 4:
                        negotiateResp = _a.sent();
                        logging_1.trc('Negotiate resp', negotiateResp.SW);
                        if (!negotiateResp.OK) {
                            logging_1.dbg('Error with negotiate resp', negotiateResp.SW);
                            tackyTag = tag;
                            if (!tackyTag['__retried']) {
                                tackyTag['__retried'] = true;
                                return [2 /*return*/, this.onTag(readerWithSpec, tag)];
                            }
                            else {
                                // Don't try and auto scan it again, assume it's something weird
                                this.eject(reader);
                                return [2 /*return*/];
                            }
                        }
                        apdu = session_utils_1.fromBase64(resp.args.get);
                        // apdu[apdu.length - 1] = 255
                        logging_1.trc('Get apdu', apdu.length, 'LE=', apdu.slice(-1));
                        return [4 /*yield*/, tag.sendAPDU(apdu)];
                    case 5:
                        apduResp = _a.sent();
                        rem = parseInt(apduResp.SW, 16) ^ 0x9100;
                        if (rem && rem != 0x100) {
                            // Don't try and auto scan it again, assume it's something weird
                            this.eject(reader);
                            return [2 /*return*/];
                        }
                        // TODO: handle non 91xx/90xx here
                        logging_1.dbg('GSTD resp', apduResp.SW);
                        responses.push(apduResp.full);
                        _a.label = 6;
                    case 6:
                        if (!(apduResp.SW === '0x9100')) return [3 /*break*/, 8];
                        logging_1.trc('Sending get more apdu');
                        return [4 /*yield*/, tag.sendAPDU('90-C0-00-00-00-00')];
                    case 7:
                        apduResp = _a.sent();
                        logging_1.trc('Get more SW', apduResp.SW);
                        responses.push(apduResp.full);
                        return [3 /*break*/, 6];
                    case 8:
                        logging_1.dbg('Responses', responses.map(function (r) { return [utils_2.hex(r.slice(-2)), r.length]; }));
                        this.unpower(reader);
                        serializedOrLiveSession = resp.session;
                        return [4 /*yield*/, this.readerSession.handleMessage({
                                session: serializedOrLiveSession,
                                cmd: messages_1.CommandKey.decrypt_smart_tap_data,
                                args: {
                                    responses: responses.map(session_utils_1.toBase64)
                                }
                            })];
                    case 9:
                        resp = (_a.sent());
                        id = uuid.v4();
                        this.events.emit(events_1.Events.smartTapData, {
                            uuid: id,
                            // TODO: should use smartTap likely
                            type: 'smart-tap',
                            reader: readerWithSpec.spec,
                            data: resp.args.data,
                            collectorId: selectOSEMsg.args.collectorId
                        });
                        _a.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    ReadersService.prototype.onApplePay = function (tag, readerWithSpec) {
        return __awaiter(this, void 0, void 0, function () {
            var reader, selectPassTypeIdentifier, gvd, resp, id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reader = readerWithSpec.reader;
                        // TODO: make this double selecting optional
                        return [4 /*yield*/, utils_1.selectOSE(tag)];
                    case 1:
                        // TODO: make this double selecting optional
                        _a.sent();
                        selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier;
                        return [4 /*yield*/, tag.sendAPDU(generateGVD(selectPassTypeIdentifier))];
                    case 2:
                        gvd = _a.sent();
                        logging_1.dbg('GVD', gvd.SW);
                        if (!(gvd.SW == '0x6287')) return [3 /*break*/, 3];
                        this.reset(reader);
                        return [3 /*break*/, 6];
                    case 3:
                        if (!gvd.OK) return [3 /*break*/, 5];
                        if (this.env.isLinux() || this.env.isOSX()) {
                            // This works on rpi0w
                            this.unpower(reader);
                        }
                        else {
                            this.eject(reader);
                        }
                        return [4 /*yield*/, this.readerSession.handleMessage({
                                cmd: messages_1.CommandKey.decrypt_vas_data,
                                args: {
                                    passTypeIdentifier: selectPassTypeIdentifier,
                                    response: session_utils_1.toBase64(gvd.full)
                                }
                            })];
                    case 4:
                        resp = _a.sent();
                        id = uuid.v4();
                        this.events.emit(events_1.Events.vasData, {
                            type: 'apple-pay',
                            uuid: id,
                            data: resp.args.data,
                            reader: readerWithSpec.spec,
                            passTypeIdentifier: selectPassTypeIdentifier
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        logging_1.trc('GVD resp', gvd.SW);
                        this.reset(reader);
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ReadersService.prototype.reset = function (reader) {
        logging_1.dbg('Resetting tag');
        reader.disconnect('reset').then();
    };
    ReadersService.prototype.unpower = function (reader) {
        logging_1.dbg('Un-powering tag');
        reader.disconnect('unPower').then();
    };
    ReadersService.prototype.eject = function (reader) {
        logging_1.dbg('Ejecting tag');
        reader.disconnect('eject').then();
    };
    ReadersService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, event_bus_1.EventBus,
            environment_service_1.EnvironmentService,
            abstract_session_handler_service_1.SessionHandlerService])
    ], ReadersService);
    return ReadersService;
}());
exports.ReadersService = ReadersService;


//# sourceURL=webpack://commonjs/./src/services/readers/readers.service.ts?"