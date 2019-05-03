import { Program } from 'bin/pn';

import { AuthorizationService } from './AuthorizationService';
import { Reader } from './reader/reader';
import { LocalSessionHandler } from './reader/sessions/local-session-handler'
import * as fs from 'fs'

// var nfcKeys = process.env.PN_NFC_KEYS && fs.existsSync(process.env.PN_NFC_KEYS) ?
//   JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString()) : undefined;
const nfcKeys = {
  "appleVAS": {
    "keys": [
      {
        "passTypeIdentifier": "pass.com.woolworthslimited.edrcard",
        "privateKeyPem": "\n-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEINn/P+gRApQses0o4PvVTxneMa2WTOogo4X+a2xF5eWdoAoGCCqGSM49\nAwEHoUQDQgAEK5Eqz4qz1/jWpk0EeehgIShMWFzr+iBT28lEaO4ZUBcrh8256Jg8\nVyIAie2rtjnU/ci+s2qlvKtplRMR7zwz0Q==\n-----END EC PRIVATE KEY-----\n"
      }
    ]
  }
}

export const configure = (program: Program) => {
  const auth = new AuthorizationService();
  const config = {
    nfc: {
      // PassNinjaDemo
      selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
      selectCollectorId: 77501435,
      keys: nfcKeys
    }
  }
  const localSession = new LocalSessionHandler(config)
  const readerSession = new Reader(localSession, config)
  readerSession.start()
};
