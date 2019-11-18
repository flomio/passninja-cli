import os from 'os';
import axios from 'axios';
import pcsc from 'flomio-js-sdk-pcsc';
import flomio from 'flomio-js-sdk';
import { v4 } from 'uuid';
import { SessionHandler } from './SessionHandler';
import { MqttService, MessageToPublish } from './MqttService';
import { ConfigurationService } from './ConfigurationService';
import { CommandKey, generateGVD, toBase64, fromBase64 } from './utils';

const trc = console.log;
const dbg = console.log;

export class Reader {
  private session?: pcsc.Session;
  readerId!: string;

  constructor(
    private config: ConfigurationService,
    private readerSession: SessionHandler,
    private mqtt?: MqttService
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

    if (!spec) {
      throw new Error("couldn't initialize reader to get serial number");
    }

    dbg('Found reader', spec);

    dbg('License Check Passed? ', await flomio.licensing.isRegistered(reader));
    if (!(await flomio.licensing.isRegistered(reader))) {
      console.error('reader not licensed.');
      process.exit(1);
    }

    this.readerId = spec.type + '-' + spec.serial_number;

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

    const passTypeIdentifier = this.config.passTypeIdentifier;
    const gvd = await tag.sendAPDU(generateGVD(passTypeIdentifier));

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
        passTypeIdentifier,
        response: toBase64(gvd.full)
      }
    });

    dbg('Apple Decrypted Payload: ', resp);

    await this.handleDecryptedMessage({
      uuid: v4(),
      reader: readerWithSpec.spec,
      type: 'apple-pay',
      //TODO: This is whole file is not type safe. Needs to be rewritten.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: resp!.args.data as any,
      passTypeIdentifier
    });

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
        passTypeIdentifier: this.config.passTypeIdentifier,
        collectorId: this.config.collectorId
      }
    };

    let resp = await this.readerSession.handleMessage(selectOSEMsg);
    trc('Select', resp);

    const responses = [];

    //TODO: This is whole file is not type safe. Needs to be rewritten.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(resp!.cmd === CommandKey.get_smart_tap_data)) {
      return;
    }

    //TODO: This is whole file is not type safe. Needs to be rewritten.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const negotiateApdu = fromBase64(resp!.args.negotiate + '33333');

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

    //TODO: This is whole file is not type safe. Needs to be rewritten.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const apdu = fromBase64(resp!.args.get!);
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

    //TODO: This is whole file is not type safe. Needs to be rewritten.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const serializedOrLiveSession = resp!.session;

    resp = await this.readerSession.handleMessage({
      session: serializedOrLiveSession,
      cmd: CommandKey.decrypt_smart_tap_data,
      args: {
        responses: responses.map(toBase64)
      }
    });

    // console.log(`publishing to topic ${this.auth.credentials.identityId}`);

    await this.handleDecryptedMessage({
      uuid: v4(),
      reader: readerWithSpec.spec,
      // TODO: should use smartTap likely
      type: 'smart-tap',
      //TODO: This is whole file is not type safe. Needs to be rewritten.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data: resp!.args.data as any,
      collectorId: selectOSEMsg.args.collectorId
    });
  };

  handleDecryptedMessage = async (message: MessageToPublish) => {
    if (this.config.http) {
      axios({
        method: 'POST',
        url: await this.config.httpUrl,
        data: JSON.stringify(message)
      }).catch(console.error);
    }

    if (this.mqtt && this.config.mqtt) {
      this.mqtt.publish(message);
    }
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
      // eslint-disable-next-line @typescript-eslint/camelcase
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
