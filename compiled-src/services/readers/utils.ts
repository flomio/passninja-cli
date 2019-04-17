
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
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var flomio_js_sdk_1 = __webpack_require__(/*! flomio-js-sdk */ \"../flomio-js-sdk/dist/ts.js\");
var FloBlePlus = flomio_js_sdk_1.readers.FloBlePlus;
function pollVAS(reader) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logging_1.dbg('Polling for vas targets');
                    // ECP version = 1
                    return [4 /*yield*/, reader.escapeCommand(('E000003B03010101')).response
                        // Terminal type = 0
                    ];
                case 1:
                    // ECP version = 1
                    _a.sent();
                    // Terminal type = 0
                    return [4 /*yield*/, reader.escapeCommand(('E000003B03010200')).response
                        // Terminal mode = VAS only
                    ];
                case 2:
                    // Terminal type = 0
                    _a.sent();
                    // Terminal mode = VAS only
                    return [4 /*yield*/, reader.escapeCommand(('E000003B03010302')).response
                        // include VAS types in polling
                    ];
                case 3:
                    // Terminal mode = VAS only
                    _a.sent();
                    // include VAS types in polling
                    return [4 /*yield*/, reader.escapeCommand(('E00000200145')).response];
                case 4:
                    // include VAS types in polling
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.pollVAS = pollVAS;
function selectOSE(tag, tries) {
    if (tries === void 0) { tries = 2; }
    return __awaiter(this, void 0, void 0, function () {
        var select;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tag.selectApplication(Buffer.from('OSE.VAS.01'))];
                case 1:
                    select = _a.sent();
                    logging_1.dbg('select VAS', select.SW);
                    tries--;
                    _a.label = 2;
                case 2:
                    if (tries && !select.OK) return [3 /*break*/, 0];
                    _a.label = 3;
                case 3: return [2 /*return*/, select];
            }
        });
    });
}
exports.selectOSE = selectOSE;
function initReaderAndGetSpec(reader) {
    return __awaiter(this, void 0, void 0, function () {
        var firmware, e_1, e_2, serialNumber, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firmware = undefined;
                    return [4 /*yield*/, reader.connect('direct')];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, reader.escapeCommand('E0 00 00 18 00')
                            .response];
                case 3:
                    firmware = (_a.sent()).data.slice(5).toString('ascii');
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    logging_1.dbg('error getting firmware');
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, pollVAS(reader)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    logging_1.dbg('Error while polling for vas', { firmware: firmware });
                    return [3 /*break*/, 8];
                case 8:
                    serialNumber = undefined;
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, FloBlePlus.prototype.getSerialNumber.call(reader)];
                case 10:
                    serialNumber = _a.sent();
                    return [3 /*break*/, 12];
                case 11:
                    e_3 = _a.sent();
                    logging_1.dbg('Error trying to get serial number');
                    return [3 /*break*/, 12];
                case 12: return [4 /*yield*/, reader.disconnect('leave')];
                case 13:
                    _a.sent();
                    return [2 /*return*/, {
                            type: reader.name.includes('1255') ?
                                'FloBLE-Plus' :
                                reader.name.includes('1311') ?
                                    'FloBLE-Micro' :
                                    'unknown',
                            serial_number: serialNumber,
                            firmware: firmware
                        }];
            }
        });
    });
}
exports.initReaderAndGetSpec = initReaderAndGetSpec;


//# sourceURL=webpack://commonjs/./src/services/readers/utils.ts?"