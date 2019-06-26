"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const pcsc = require("flomio-js-sdk-pcsc");
const os = require("os");
const flomio = require("flomio-js-sdk");
const SessionUtils_1 = require("./SessionUtils");
const Logging_1 = require("../Logging");
class Reader {
    constructor(readerSession, config) {
        this.readerSession = readerSession;
        this.config = config;
        this.start = () => {
            const connectionMode = os.platform() === 'win32' ? 'shared' : 'exclusive';
            Logging_1.dbg('Creating pcsc.Session with', { connectionMode });
            this.session = new pcsc.Session({
                connectionMode
            });
            this.session.on('reader', this.onReader.bind(this));
        };
        this.onReader = (reader) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const spec = yield this.initReaderAndGetSpec(reader);
            Logging_1.dbg('Found reader', spec);
            const withSpec = { reader, spec };
            reader.on('tagScanned', this.onTag.bind(this, withSpec));
        });
        this.onTag = (reader, tag) => {
            // TODO: handle unknown tags and pray
            if (tag.type === 'hceDevice') {
                return this.onHceDevice(reader, tag);
            }
        };
        this.onHceDevice = (reader, tag) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const selected = yield this.selectOSE(tag);
            if (!selected || !selected.OK) {
                // TODO: more info! typed events!
                // this.events.emit(errorSelectOse, {
                //   SW: selected.SW
                // })
                return;
            }
            try {
                if (selected.data.toString().includes('ApplePay')) {
                    yield this.onApplePay(tag, reader);
                }
                else {
                    yield this.onSmartTap(selected, tag, reader);
                }
            }
            catch (err) {
                Logging_1.dbg('Scan error', err);
                this.eject(reader);
                return;
            }
        });
        this.onApplePay = (tag, readerWithSpec) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const reader = readerWithSpec.reader;
            // TODO: make this double selecting optional
            yield this.selectOSE(tag);
            const selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier;
            const gvd = yield tag.sendAPDU(SessionUtils_1.generateGVD(selectPassTypeIdentifier));
            Logging_1.dbg('GVD', gvd.SW);
            if (gvd.SW === '0x6287') {
                return;
            }
            this.reset(reader);
            if (!gvd.OK) {
                return;
            }
            // if (process.env.isLinux() || this.env.isOSX()) {
            // This works on rpi0w
            this.unpower(reader);
            // } else {
            //   this.eject(reader)
            // }
            const resp = yield this.readerSession.handleMessage({
                cmd: 12 /* decrypt_vas_data */,
                args: {
                    passTypeIdentifier: selectPassTypeIdentifier,
                    response: SessionUtils_1.toBase64(gvd.full)
                }
            });
            Logging_1.dbg('Apple Decrypted Payload: ', resp);
            // this.events.emit(vasData, {
            //   type: "apple-pay",
            //   uuid: v4(),
            //   data: resp.args.data,
            //   reader: readerWithSpec.spec,
            //   passTypeIdentifier: selectPassTypeIdentifier
            // })
            Logging_1.trc('GVD resp', gvd.SW);
            this.reset(reader);
        });
        this.onSmartTap = (selectResp, tag, readerWithSpec) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            Logging_1.dbg('Double selecting to delay');
            const selectResp2 = yield this.selectOSE(tag);
            if (!selectResp2 || !selectResp2.OK) {
                return;
            }
            const reader = readerWithSpec.reader;
            const selectOSEMsg = {
                cmd: 0 /* select_ose */,
                args: {
                    // TODO: seems senseless to encode as string when session handler
                    // is running locally
                    response: selectResp2.full.toString('base64'),
                    passTypeIdentifier: this.config.nfc.selectPassTypeIdentifier,
                    collectorId: this.config.nfc.selectCollectorId
                }
            };
            let resp = yield this.readerSession.handleMessage(selectOSEMsg);
            Logging_1.trc('Select', resp);
            const responses = [];
            if (!(resp.cmd === 2 /* get_smart_tap_data */)) {
                return;
            }
            const negotiateApdu = SessionUtils_1.fromBase64(resp.args.negotiate + '33333');
            Logging_1.trc('Negotiate apdu', negotiateApdu.toString('hex'));
            const negotiateResp = yield tag.sendAPDU(negotiateApdu);
            Logging_1.trc('Negotiate resp', negotiateResp.SW);
            if (!negotiateResp.OK) {
                Logging_1.dbg('Error with negotiate resp', negotiateResp.SW);
                const tackyTag = tag;
                if (!('__retried' in tackyTag)) {
                    Logging_1.dbg('__retried');
                    tackyTag.__retried = true;
                    return this.onHceDevice(readerWithSpec, tag);
                }
                else {
                    Logging_1.dbg('not __retried');
                    // Don't try and auto scan it again, assume it's something weird
                    this.eject(reader);
                    return;
                }
            }
            const apdu = SessionUtils_1.fromBase64(resp.args.get);
            // apdu[apdu.length - 1] = 255
            Logging_1.trc('Get apdu', apdu.length, 'LE=', apdu.slice(-1));
            let apduResp = yield tag.sendAPDU(apdu);
            Logging_1.dbg('apduResp resp', apduResp.SW);
            const rem = parseInt(apduResp.SW, 16) ^ 0x9100;
            if (rem && rem !== 0x100) {
                // Don't try and auto scan it again, assume it's something weird
                this.eject(reader);
                return;
            }
            // TODO: handle non 91xx/90xx here
            Logging_1.dbg('GSTD resp', apduResp.SW);
            responses.push(apduResp.full);
            if (!(apduResp.SW === '0x9100')) {
                Logging_1.dbg('9100', apduResp);
                return;
            }
            Logging_1.trc('Sending get more apdu');
            apduResp = yield tag.sendAPDU('90-C0-00-00-00-00');
            Logging_1.trc('Get more SW', apduResp.SW);
            responses.push(apduResp.full);
            Logging_1.dbg('Responses', responses.map(r => [flomio.utils.hex(r.slice(-2)), r.length]));
            this.unpower(reader);
            const serializedOrLiveSession = resp.session;
            resp = yield this.readerSession.handleMessage({
                session: serializedOrLiveSession,
                cmd: 9 /* decrypt_smart_tap_data */,
                args: {
                    responses: responses.map(SessionUtils_1.toBase64)
                }
            });
            // this.events.emit(smartTapData, {
            //   uuid: v4(),
            //   // TODO: should use smartTap likely
            //   type: "smart-tap",
            //   reader: readerWithSpec.spec,
            //   data: resp.args.data,
            //   collectorId: selectOSEMsg.args.collectorId
            // })
        });
        this.eject = (reader) => {
            Logging_1.dbg('Ejecting tag');
            reader.disconnect('eject').then().catch();
        };
        this.reset = (reader) => {
            Logging_1.dbg('resetting tag');
            reader.disconnect('reset').then();
        };
        this.unpower = (reader) => {
            Logging_1.dbg('unpowering tag');
            reader.disconnect('unPower').then();
        };
        this.initReaderAndGetSpec = (reader) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield reader.connect('direct');
            let firmware;
            try {
                firmware = (yield reader.escapeCommand('E0 00 00 18 00').response).data
                    .slice(5)
                    .toString('ascii');
            }
            catch (err) {
                Logging_1.dbg('Error getting firmware');
                return;
            }
            try {
                yield this.pollVAS(reader);
            }
            catch (err) {
                Logging_1.dbg('Error while polling for vas', { firmware });
                return;
            }
            let serialNumber;
            try {
                serialNumber = yield flomio.FloBlePlusBase.prototype.getSerialNumber.call(reader);
            }
            catch (err) {
                Logging_1.dbg('Error while polling for vas', { firmware });
                return;
            }
            yield reader.disconnect('leave');
            return {
                type: reader.name.includes('1255')
                    ? 'FloBLE-Plus'
                    : reader.name.includes('1311')
                        ? 'FloBLE-Micro'
                        : 'unknown',
                serial_number: serialNumber,
                firmware
            };
        });
        this.pollVAS = (reader) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            Logging_1.dbg('Polling for vas targets');
            // ECP version = 1
            yield reader.escapeCommand('E000003B03010101').response;
            // Terminal type = 0
            yield reader.escapeCommand('E000003B03010200').response;
            // Terminal mode = VAS only
            yield reader.escapeCommand('E000003B03010302').response;
            // include VAS types in polling
            // TODO: ...
            yield reader.escapeCommand('E00000200145').response;
            // include VAS types in polling
        });
        this.selectOSE = (tag, tries = 2) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const select = yield tag.selectApplication(Buffer.from('OSE.VAS.01'));
            Logging_1.dbg('Select VAS', select.SW);
            tries--;
            if (tries && !select.OK) {
                return;
            }
            return select;
        });
    }
}
exports.Reader = Reader;
//# sourceMappingURL=Reader.js.map