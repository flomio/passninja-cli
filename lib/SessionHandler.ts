import * as appleVAS from 'apple-vas-data-decrypt';
import { CommandKey, fromBase64, toBase64, generateGVD } from './utils';
import { dbg } from '../no_compile/Logging';
import {
  SecureSmartTapSession,
  getRedemptionValues
} from '../../smart-tap/dist';
import { utils } from 'flomio-js-sdk';

export class SessionHandler {
  constructor(private config: any) {}

  getDecrypter = () => {
    const key1 = this.config.nfc.keys.appleVAS.keys[0];
    const decrypter = appleVAS.makeDecrypter(
      this.config.nfc.selectPassTypeIdentifier,
      key1.privateKeyPem
    );
    return decrypter;
  };

  get isLocal() {
    return true;
  }

  nfcConf() {
    return this.config.nfc.keys;
  }

  async handleMessage(message: { cmd: CommandKey; args: any; session?: any }) {
    dbg('handling message', message);

    if (message.cmd === CommandKey.select_ose) {
      const key = this.nfcConf().googleSmartTap.keys[0];

      const session = new SecureSmartTapSession({
        type: 'privateKey',
        collectorId: this.config.nfc.selectCollectorId,
        privateKey: {
          version: key.version,
          pem: key.privateKeyPem
        }
      });
      await session.selectOSECommand();
      // assume this has already been sorted

      const parsed = session.parseSelectOSEResponse(
        fromBase64(message.args.response)
      );

      dbg('found smart tap', JSON.stringify(parsed));

      if (parsed.isSmartTap) {
        const negotiateCommand = await session.negotiateSecureSessionCommand();

        session.preEmptParse();

        const getCommand = session.getSmartTapDataCommand();

        return {
          session: session,
          cmd: CommandKey.get_smart_tap_data,
          args: {
            negotiate: toBase64(negotiateCommand),
            get: toBase64(getCommand)
          }
        };
        // TODO: this was commented in the original source on aws. why?
        // return sendApdu(session, CommandKey.negotiate_session, session.negotiateSecureSessionCommand())
      } else {
        return {
          cmd: CommandKey.get_vas_data,
          args: {
            get: utils
              .unhex(generateGVD(this.config.nfc.selectPassTypeIdentifier))
              .toString('base64')
          }
        };
      }
    } else if (message.cmd === CommandKey.decrypt_smart_tap_data) {
      dbg('decrypt_smart_tap_data');
      const session = message.session;
      dbg(JSON.stringify(session));
      message.args.responses.map(async (response: string) => {
        const apdu = fromBase64(response);
        dbg('parsed get st data resp apdu', apdu.slice(-2), apdu.length);
        return session.parseGetSmartTapDataResponse(apdu);
      });
      dbg('parseFullPayload');
      const fullPayload = await session.parseFullPayload();

      const values = !!fullPayload ? getRedemptionValues(fullPayload) : [];
      dbg('values');
      dbg(values);

      return {
        cmd: CommandKey.decrypted_smart_tap_data,
        args: {
          data: values
        }
      };
    } else if (message.cmd === CommandKey.decrypt_vas_data) {
      const decrypter = this.getDecrypter();
      const decrypted = decrypter(fromBase64(message.args.response));

      if (!decrypted.success) {
        dbg(decrypted.error);
      }

      return {
        cmd: CommandKey.decrypted_vas_data,
        args: { data: decrypted.data }
      };
    }

    return null;
  }
}
