import { Program } from "../bin/pn";

// import { AuthorizationService } from './AuthorizationService';
// import { initNewClient } from './IotService';
// import { Configuration } from './Configuration';
// import { CleanUpService } from './CleanUpService';
// import { CognitoIdentityCredentials } from 'aws-sdk';

// export const configure = (program: Program) => {
//   const { username, password } = program;

//   const config = new Configuration();

//   const auth = new AuthorizationService(config, username, password);

//   auth.login().then(() => initNewClient({ auth, config }));
// };
// import { AuthorizationService } from './AuthorizationService'
import { Reader } from "./reader/Reader";
import { LocalSessionHandler } from "./reader/sessions/LocalSessionHandler";
import * as fs from "fs";

const nfcKeys =
  process.env.PN_NFC_KEYS && fs.existsSync(process.env.PN_NFC_KEYS)
    ? JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString())
    : undefined;

export const configure = (program: Program) => {
  // const auth = new AuthorizationService()
  const config = {
    nfc: {
      // PassNinjaDemo
      selectPassTypeIdentifier: "pass.com.ndudfield.nfc",
      selectCollectorId: 77501435,
      keys: nfcKeys
    }
  };
  const localSession = new LocalSessionHandler(config);
  const readerSession = new Reader(localSession, config);
  readerSession.start();
};
