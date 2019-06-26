"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var pcsc = require("flomio-js-sdk-pcsc");
var os = require("os");
var flomio = require("flomio-js-sdk");
var utils_1 = require("./utils");
var uuid_1 = require("uuid");
var trc = console.log;
var dbg = console.log;
var Reader = /** @class */ (function () {
    function Reader(config, readerSession, mqtt) {
        var _this = this;
        this.config = config;
        this.readerSession = readerSession;
        this.mqtt = mqtt;
        this.start = function () {
            var connectionMode = os.platform() === 'win32' ? 'shared' : 'exclusive';
            dbg('Creating pcsc.Session with', { connectionMode: connectionMode });
            _this.session = new pcsc.Session({
                connectionMode: connectionMode
            });
            _this.session.on('reader', _this.onReader.bind(_this));
        };
        this.onReader = function (reader) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var spec, withSpec;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initReaderAndGetSpec(reader)];
                    case 1:
                        spec = _a.sent();
                        if (!spec) {
                            throw new Error('couldnt intialize reader to get serial number');
                        }
                        dbg('Found reader', spec);
                        this.readerId = spec.type + '-' + spec.serial_number;
                        withSpec = { reader: reader, spec: spec };
                        reader.on('tagScanned', this.onTag.bind(this, withSpec));
                        return [2 /*return*/];
                }
            });
        }); };
        this.onTag = function (reader, tag) {
            // TODO: handle unknown tags and pray
            if (tag.type === 'hceDevice') {
                return _this.onHceDevice(reader, tag);
            }
        };
        this.onHceDevice = function (reader, tag) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var selected, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.selectOSE(tag)];
                    case 1:
                        selected = _a.sent();
                        if (!selected || !selected.OK) {
                            // TODO: more info! typed events!
                            // this.events.emit(errorSelectOse, {
                            //   SW: selected.SW
                            // })
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
                        err_1 = _a.sent();
                        dbg('Scan error', err_1);
                        this.eject(reader);
                        return [2 /*return*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        this.onApplePay = function (tag, readerWithSpec) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var reader, selectPassTypeIdentifier, gvd, resp;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reader = readerWithSpec.reader;
                        // TODO: make this double selecting optional
                        return [4 /*yield*/, this.selectOSE(tag)];
                    case 1:
                        // TODO: make this double selecting optional
                        _a.sent();
                        selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier;
                        return [4 /*yield*/, tag.sendAPDU(utils_1.generateGVD(selectPassTypeIdentifier))];
                    case 2:
                        gvd = _a.sent();
                        dbg('GVD', gvd.SW);
                        if (gvd.SW === '0x6287') {
                            return [2 /*return*/];
                        }
                        this.reset(reader);
                        if (!gvd.OK) {
                            return [2 /*return*/];
                        }
                        // if (process.env.isLinux() || this.env.isOSX()) {
                        // This works on rpi0w
                        this.unpower(reader);
                        return [4 /*yield*/, this.readerSession.handleMessage({
                                cmd: 12 /* decrypt_vas_data */,
                                args: {
                                    passTypeIdentifier: selectPassTypeIdentifier,
                                    response: utils_1.toBase64(gvd.full)
                                }
                            })];
                    case 3:
                        resp = _a.sent();
                        dbg('Apple Decrypted Payload: ', resp);
                        // console.log(`publishing to topic ${this.auth.credentials.identityId}`);
                        return [4 /*yield*/, this.mqtt.publish(JSON.stringify({
                                type: 'apple-pay',
                                uuid: uuid_1.v4(),
                                data: resp.args.data,
                                reader: readerWithSpec.spec,
                                passTypeIdentifier: selectPassTypeIdentifier
                            }))];
                    case 4:
                        // console.log(`publishing to topic ${this.auth.credentials.identityId}`);
                        _a.sent();
                        trc('GVD resp', gvd.SW);
                        this.reset(reader);
                        return [2 /*return*/];
                }
            });
        }); };
        this.onSmartTap = function (selectResp, tag, readerWithSpec) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var selectResp2, reader, selectOSEMsg, resp, responses, negotiateApdu, negotiateResp, tackyTag, apdu, apduResp, rem, serializedOrLiveSession;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dbg('Double selecting to delay');
                        return [4 /*yield*/, this.selectOSE(tag)];
                    case 1:
                        selectResp2 = _a.sent();
                        if (!selectResp2 || !selectResp2.OK) {
                            return [2 /*return*/];
                        }
                        reader = readerWithSpec.reader;
                        selectOSEMsg = {
                            cmd: 0 /* select_ose */,
                            args: {
                                // TODO: seems senseless to encode as string when session handler
                                // is running locally
                                response: selectResp2.full.toString('base64'),
                                passTypeIdentifier: this.config.nfc.selectPassTypeIdentifier,
                                collectorId: this.config.nfc.selectCollectorId
                            }
                        };
                        return [4 /*yield*/, this.readerSession.handleMessage(selectOSEMsg)];
                    case 2:
                        resp = _a.sent();
                        trc('Select', resp);
                        responses = [];
                        if (!(resp.cmd === 2 /* get_smart_tap_data */)) {
                            return [2 /*return*/];
                        }
                        negotiateApdu = utils_1.fromBase64(resp.args.negotiate + '33333');
                        trc('Negotiate apdu', negotiateApdu.toString('hex'));
                        return [4 /*yield*/, tag.sendAPDU(negotiateApdu)];
                    case 3:
                        negotiateResp = _a.sent();
                        trc('Negotiate resp', negotiateResp.SW);
                        if (!negotiateResp.OK) {
                            dbg('Error with negotiate resp', negotiateResp.SW);
                            tackyTag = tag;
                            if (!('__retried' in tackyTag)) {
                                dbg('__retried');
                                tackyTag.__retried = true;
                                return [2 /*return*/, this.onHceDevice(readerWithSpec, tag)];
                            }
                            else {
                                dbg('not __retried');
                                // Don't try and auto scan it again, assume it's something weird
                                this.eject(reader);
                                return [2 /*return*/];
                            }
                        }
                        apdu = utils_1.fromBase64(resp.args.get);
                        // apdu[apdu.length - 1] = 255
                        trc('Get apdu', apdu.length, 'LE=', apdu.slice(-1));
                        return [4 /*yield*/, tag.sendAPDU(apdu)];
                    case 4:
                        apduResp = _a.sent();
                        dbg('apduResp resp', apduResp.SW);
                        rem = parseInt(apduResp.SW, 16) ^ 0x9100;
                        if (rem && rem !== 0x100) {
                            // Don't try and auto scan it again, assume it's something weird
                            this.eject(reader);
                            return [2 /*return*/];
                        }
                        // TODO: handle non 91xx/90xx here
                        dbg('GSTD resp', apduResp.SW);
                        responses.push(apduResp.full);
                        if (!(apduResp.SW === '0x9100')) {
                            dbg('9100', apduResp);
                            return [2 /*return*/];
                        }
                        trc('Sending get more apdu');
                        return [4 /*yield*/, tag.sendAPDU('90-C0-00-00-00-00')];
                    case 5:
                        apduResp = _a.sent();
                        trc('Get more SW', apduResp.SW);
                        responses.push(apduResp.full);
                        dbg('Responses', responses.map(function (r) { return [flomio.utils.hex(r.slice(-2)), r.length]; }));
                        this.unpower(reader);
                        serializedOrLiveSession = resp.session;
                        return [4 /*yield*/, this.readerSession.handleMessage({
                                session: serializedOrLiveSession,
                                cmd: 9 /* decrypt_smart_tap_data */,
                                args: {
                                    responses: responses.map(utils_1.toBase64)
                                }
                            })];
                    case 6:
                        resp = _a.sent();
                        // console.log(`publishing to topic ${this.auth.credentials.identityId}`);
                        return [4 /*yield*/, this.mqtt.publish(JSON.stringify({
                                uuid: uuid_1.v4(),
                                // TODO: should use smartTap likely
                                type: 'smart-tap',
                                reader: readerWithSpec.spec,
                                data: resp.args.data,
                                collectorId: selectOSEMsg.args.collectorId
                            }))];
                    case 7:
                        // console.log(`publishing to topic ${this.auth.credentials.identityId}`);
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.eject = function (reader) {
            dbg('Ejecting tag');
            reader
                .disconnect('eject')
                .then()
                .catch();
        };
        this.reset = function (reader) {
            dbg('resetting tag');
            reader.disconnect('reset').then();
        };
        this.unpower = function (reader) {
            dbg('unpowering tag');
            reader.disconnect('unPower').then();
        };
        this.initReaderAndGetSpec = function (reader) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var firmware, err_2, err_3, serialNumber, err_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, reader.connect('direct')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, reader.escapeCommand('E0 00 00 18 00').response];
                    case 3:
                        firmware = (_a.sent()).data
                            .slice(5)
                            .toString('ascii');
                        return [3 /*break*/, 5];
                    case 4:
                        err_2 = _a.sent();
                        dbg('Error getting firmware');
                        return [2 /*return*/];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.pollVAS(reader)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        err_3 = _a.sent();
                        dbg('Error while polling for vas', { firmware: firmware });
                        return [2 /*return*/];
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, flomio.FloBlePlusBase.prototype.getSerialNumber.call(reader)];
                    case 9:
                        serialNumber = _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        err_4 = _a.sent();
                        dbg('Error while polling for vas', { firmware: firmware });
                        return [2 /*return*/];
                    case 11: return [4 /*yield*/, reader.disconnect('leave')];
                    case 12:
                        _a.sent();
                        return [2 /*return*/, {
                                type: reader.name.includes('1255')
                                    ? 'FloBLE-Plus'
                                    : reader.name.includes('1311')
                                        ? 'FloBLE-Micro'
                                        : 'unknown',
                                serial_number: serialNumber,
                                firmware: firmware
                            }];
                }
            });
        }); };
        this.pollVAS = function (reader) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dbg('Polling for vas targets');
                        // ECP version = 1
                        return [4 /*yield*/, reader.escapeCommand('E000003B03010101').response];
                    case 1:
                        // ECP version = 1
                        _a.sent();
                        // Terminal type = 0
                        return [4 /*yield*/, reader.escapeCommand('E000003B03010200').response];
                    case 2:
                        // Terminal type = 0
                        _a.sent();
                        // Terminal mode = VAS only
                        return [4 /*yield*/, reader.escapeCommand('E000003B03010302').response];
                    case 3:
                        // Terminal mode = VAS only
                        _a.sent();
                        // include VAS types in polling
                        // TODO: ...
                        return [4 /*yield*/, reader.escapeCommand('E00000200145').response];
                    case 4:
                        // include VAS types in polling
                        // TODO: ...
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.selectOSE = function (tag, tries) {
            if (tries === void 0) { tries = 2; }
            return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var select;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, tag.selectApplication(Buffer.from('OSE.VAS.01'))];
                        case 1:
                            select = _a.sent();
                            dbg('Select VAS', select.SW);
                            tries--;
                            if (tries && !select.OK) {
                                return [2 /*return*/];
                            }
                            return [2 /*return*/, select];
                    }
                });
            });
        };
    }
    return Reader;
}());
exports.Reader = Reader;
//# sourceMappingURL=Reader.js.map