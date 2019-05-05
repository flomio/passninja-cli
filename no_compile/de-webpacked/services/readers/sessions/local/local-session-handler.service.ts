import { Injectable, Inject } from '@angular/core';
import { CONFIG_TOKEN } from 'src/app/injection-tokens';
import { SecureSmartTapSession, getRedemptionValues } from 'smart-tap';
import { unhex } from 'flomio-js-sdk-pcsc/dist/utils';
import { makeDecrypter } from 'apple-vas-data-decrypt';

// var smart_tap_1 = __webpack_require__(/*! smart-tap */ \"../smart-tap/dist/index.js\");
// var utils_1 = __webpack_require__(/*! flomio-js-sdk-pcsc/dist/utils */ \"../flomio-js-sdk-pcsc/dist/utils.js\");
// var apple_vas_data_decrypt_1 = __webpack_require__(/*! apple-vas-data-decrypt */ \"../apple-vas-data-decrypt/dist/index.js\");

// var abstract_session_handler_service_1 = __webpack_require__
// (/*! ../abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");
import { CommandKey } from '../../messages';
import { dbg, trc } from '../../../../logging';
import { generateGVD } from '../../readers.service';
import { fromBase64, toBase64 } from '../../session-utils';

@Injectable()
export class LocalSessionHandlerService /** extends AbstractSessionHandler */ {
  constructor(@Inject(CONFIG_TOKEN) private config: any) {}

  get isLocal() {
    return true;
  }

  get nfcConf() {
    return this.config.nfc.keys;
  }

  // TODO: cache
  // TODO: find the key that matches passTypeIdentifier
  getDecrypter = () => {
    const key1 = this.config.nfc.keys.appleVAS.keys[0];
    const decrypter = makeDecrypter(
      this.config.nfc.selectPassTypeIdentifier,
      key1.privateKeyPem
    );
    return decrypter;
  };

  handleMessage = async message => {
    trc('handling message', message);

    if (!(message.cmd === CommandKey.select_ose)) {
      return;
    }

    const key = this.nfcConf().googleSmartTap.keys[0];

    let session = new SecureSmartTapSession({
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

    trc('found smart tap', JSON.stringify(parsed));

    let negotiateCommand;

    if (!parsed.isSmartTap) {
      negotiateCommand = {
        cmd: CommandKey.get_vas_data,
        args: {
          get: unhex(
            generateGVD(this.config.nfc.selectPassTypeIdentifier)
          ).toString('base64')
        }
      };
    } else {
      negotiateCommand = await session.negotiateSecureSessionCommand();
      session.preEmptParse();
      const getCommand = await session.getSmartTapDataCommand();

      negotiateCommand = {
        session: session,
        cmd: CommandKey.get_smart_tap_data,
        args: {
          negotiate: toBase64(negotiateCommand),
          get: toBase64(getCommand)
        }
      };
      // return sendApdu(session, CommandKey.negotiate_session, session.negotiateSecureSessionCommand())
    }

    /**
     *
     *
     *
     *
     *
     */

    if (!(message.cmd === CommandKey.decrypt_smart_tap_data)) {
      if (message.cmd === CommandKey.decrypt_vas_data) {
        const decrypter = this.getDecrypter();
        const decrypted = decrypter(fromBase64(message.args.response));

        if (!decrypted.success) {
          console.log(decrypted.error);
        }

        return {
          cmd: CommandKey.decrypted_vas_data,
          args: { data: decrypted.data }
        };
      }
    } else {
      session = message.session;

      message.args.responses.map(async response => {
        let apdu = fromBase64(response);
        trc('parsed get st data resp apdu', apdu.slice(-2), apdu.length);
        return await session.parseGetSmartTapDataResponse(apdu);
      });

      let fullPayload = await session.parseFullPayload();

      let values = !!fullPayload ? getRedemptionValues(fullPayload) : [];

      return {
        cmd: CommandKey.decrypted_smart_tap_data,
        args: {
          data: values
        }
      };
    }

    return null;
  };
}
