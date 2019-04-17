import logging from "../../logging"
var flomio_js_sdk_1 = __webpack_require__(/*! flomio-js-sdk */ \"../flomio-js-sdk/dist/ts.js\");
var FloBlePlus = flomio_js_sdk_1.readers.FloBlePlus;

export const pollVAS = reader => {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logging.dbg('Polling for vas targets');
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
// exports.pollVAS = pollVAS;

export const selectOSE = (tag, tries) =>{
    if (tries === void 0) { tries = 2; }
    return __awaiter(this, void 0, void 0, function () {
        var select;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tag.selectApplication(Buffer.from('OSE.VAS.01'))];
                case 1:
                    select = _a.sent();
                    logging.dbg('select VAS', select.SW);
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
// exports.selectOSE = selectOSE;
export const initReaderAndGetSpec = reader => {
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
                    logging.dbg('error getting firmware');
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, pollVAS(reader)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    logging.dbg('Error while polling for vas', { firmware: firmware });
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
                    logging.dbg('Error trying to get serial number');
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
// exports.initReaderAndGetSpec = initReaderAndGetSpec;


//# sourceURL=webpack://commonjs/./src/services/readers/utils.ts?"
