import * as pcsc from 'flomio-js-sdk-pcsc';
import { SessionHandler } from './sessions/AbstractSessionHandler';
import * as os from 'os';
import * as flomio from 'flomio-js-sdk';
import { CommandKey } from './Messages';
import { generateGVD, toBase64, fromBase64 } from './SessionUtils';
import { dbg, trc } from '../Logging';
import { Configuration } from 'lib/Configuration';

export class Reader {
  private session?: pcsc.Session;

  constructor(
    private readerSession: SessionHandler,
    private config: Configuration
  ) {}

  start = () => {
    const connectionMode = os.platform() === 'win32' ? 'shared' : 'exclusive';
    dbg('Creating pcsc.Session with', { connectionMode });
    this.session = new pcsc.Session({
      connectionMode
    });

    this.session.on('reader', this.onReader.bind(this));
  };

  onReader = async (reader: pcsc.PCSCReader) => {
    const spec = await this.initReaderAndGetSpec(reader);

    dbg('Found reader', spec);

    const withSpec = { reader, spec };

    reader.on('tagScanned', this.onTag.bind(this, withSpec));
  };

  onTag = (reader: any, tag: flomio.tags.HCEDevice) => {
    // TODO: handle unknown tags and pray
    if (tag.type === 'hceDevice') {
      return this.onHceDevice(reader, tag);
    }
  };

  onHceDevice = async (reader: pcsc.PCSCReader, tag: flomio.tags.HCEDevice) => {
    const selected = await this.selectOSE(tag);

    if (!selected || !selected.OK) {
      // TODO: more info! typed events!
      // this.events.emit(errorSelectOse, {
      //   SW: selected.SW
      // })
      return;
    }

    try {
      if (selected.data.toString().includes('ApplePay')) {
        await this.onApplePay(tag, reader);
      } else {
        await this.onSmartTap(selected, tag, reader);
      }
    } catch (err) {
      dbg('Scan error', err);
      this.eject(reader);
      return;
    }
  };

  onApplePay = async (tag: flomio.tags.HCEDevice, readerWithSpec: any) => {
    const reader = readerWithSpec.reader;

    // TODO: make this double selecting optional
    await this.selectOSE(tag);

    const selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier;
    const gvd = await tag.sendAPDU(generateGVD(selectPassTypeIdentifier));

    dbg('GVD', gvd.SW);

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

    const resp = await this.readerSession.handleMessage({
      cmd: CommandKey.decrypt_vas_data,
      args: {
        passTypeIdentifier: selectPassTypeIdentifier,
        response: toBase64(gvd.full)
      }
    });

    dbg('Apple Decrypted Payload: ', resp);

    // this.events.emit(vasData, {
    //   type: "apple-pay",
    //   uuid: v4(),
    //   data: resp.args.data,
    //   reader: readerWithSpec.spec,
    //   passTypeIdentifier: selectPassTypeIdentifier
    // })

    trc('GVD resp', gvd.SW);
    this.reset(reader);
  };

  onSmartTap = async (
    selectResp: flomio.IAPDUResponse,
    tag: flomio.tags.HCEDevice,
    readerWithSpec: any
  ) => {
    dbg('Double selecting to delay');
    const selectResp2 = await this.selectOSE(tag);
    if (!selectResp2 || !selectResp2.OK) {
      return;
    }
    const reader = readerWithSpec.reader;

    const selectOSEMsg = {
      cmd: CommandKey.select_ose,
      args: {
        // TODO: seems senseless to encode as string when session handler
        // is running locally
        response: selectResp2.full.toString('base64'),
        passTypeIdentifier: this.config.nfc.selectPassTypeIdentifier,
        collectorId: this.config.nfc.selectCollectorId
      }
    };

    let resp = await this.readerSession.handleMessage(selectOSEMsg);
    trc('Select', resp);

    const responses = [];

    if (!(resp.cmd === CommandKey.get_smart_tap_data)) {
      return;
    }

    const negotiateApdu = fromBase64(resp.args.negotiate + '33333');

    trc('Negotiate apdu', negotiateApdu.toString('hex'));

    const negotiateResp = await tag.sendAPDU(negotiateApdu);

    trc('Negotiate resp', negotiateResp.SW);

    if (!negotiateResp.OK) {
      dbg('Error with negotiate resp', negotiateResp.SW);

      const tackyTag = tag as any;
      if (!('__retried' in tackyTag)) {
        dbg('__retried');
        tackyTag.__retried = true;
        return this.onHceDevice(readerWithSpec, tag);
      } else {
        dbg('not __retried');
        // Don't try and auto scan it again, assume it's something weird
        this.eject(reader);
        return;
      }
    }

    const apdu = fromBase64(resp.args.get);
    // apdu[apdu.length - 1] = 255
    trc('Get apdu', apdu.length, 'LE=', apdu.slice(-1));

    let apduResp = await tag.sendAPDU(apdu);
    dbg('apduResp resp', apduResp.SW);

    const rem = parseInt(apduResp.SW, 16) ^ 0x9100;

    if (rem && rem !== 0x100) {
      // Don't try and auto scan it again, assume it's something weird
      this.eject(reader);
      return;
    }
    // TODO: handle non 91xx/90xx here

    dbg('GSTD resp', apduResp.SW);

    responses.push(apduResp.full);

    if (!(apduResp.SW === '0x9100')) {
      dbg('9100', apduResp);
      return;
    }

    trc('Sending get more apdu');

    apduResp = await tag.sendAPDU('90-C0-00-00-00-00');

    trc('Get more SW', apduResp.SW);

    responses.push(apduResp.full);

    dbg(
      'Responses',
      responses.map(r => [flomio.utils.hex(r.slice(-2)), r.length])
    );

    this.unpower(reader);

    const serializedOrLiveSession = resp.session;

    resp = await this.readerSession.handleMessage({
      session: serializedOrLiveSession,
      cmd: CommandKey.decrypt_smart_tap_data,
      args: {
        responses: responses.map(toBase64)
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
  };

  eject = (reader: pcsc.PCSCReader) => {
    dbg('Ejecting tag');
    reader
      .disconnect('eject')
      .then()
      .catch();
  };

  reset = (reader: any) => {
    dbg('resetting tag');
    reader.disconnect('reset').then();
  };

  unpower = (reader: any) => {
    dbg('unpowering tag');
    reader.disconnect('unPower').then();
  };

  initReaderAndGetSpec = async (reader: pcsc.PCSCReader) => {
    await reader.connect('direct');

    let firmware: string;

    try {
      firmware = (await reader.escapeCommand('E0 00 00 18 00').response).data
        .slice(5)
        .toString('ascii');
    } catch (err) {
      dbg('Error getting firmware');
      return;
    }

    try {
      await this.pollVAS(reader);
    } catch (err) {
      dbg('Error while polling for vas', { firmware });
      return;
    }

    let serialNumber: string;

    try {
      serialNumber = await flomio.FloBlePlusBase.prototype.getSerialNumber.call(
        reader
      );
    } catch (err) {
      dbg('Error while polling for vas', { firmware });
      return;
    }

    await reader.disconnect('leave');

    return {
      type: reader.name.includes('1255')
        ? 'FloBLE-Plus'
        : reader.name.includes('1311')
        ? 'FloBLE-Micro'
        : 'unknown',
      serial_number: serialNumber,
      firmware
    };
  };

  pollVAS = async (reader: pcsc.PCSCReader) => {
    dbg('Polling for vas targets');
    // ECP version = 1
    await reader.escapeCommand('E000003B03010101').response;
    // Terminal type = 0
    await reader.escapeCommand('E000003B03010200').response;
    // Terminal mode = VAS only
    await reader.escapeCommand('E000003B03010302').response;
    // include VAS types in polling
    // TODO: ...
    await reader.escapeCommand('E00000200145').response;
    // include VAS types in polling
  };

  selectOSE = async (tag: flomio.IType4Tag, tries = 2) => {
    const select = await tag.selectApplication(Buffer.from('OSE.VAS.01'));
    dbg('Select VAS', select.SW);
    tries--;
    if (tries && !select.OK) {
      return;
    }

    return select;
  };
}
