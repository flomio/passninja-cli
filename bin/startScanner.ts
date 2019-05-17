// import { AuthorizationService } from './AuthorizationService';
// import { initNewClient } from './IotService';
// import { Configuration } from './Configuration';
// import { CleanUpService } from './CleanUpService';
// import { CognitoIdentityCredentials } from 'aws-sdk';

import * as fs from 'fs';

import { Program } from './pn';
import { Reader } from '../lib/reader/Reader';
import { LocalSessionHandler } from '../lib/reader/sessions/LocalSessionHandler';
import { Configuration } from '../lib/Configuration';
import { AuthorizationService } from '../lib/AuthorizationService';

export const startScanner = (program: Program) => {
  const { username, password } = program;

  const config = new Configuration();

  const auth = new AuthorizationService(config, username, password);

  // const localSession = new LocalSessionHandler(config);

  // const readerSession = new Reader(localSession, config);

  // readerSession.start();

  // auth.login().then(() => initNewClient({ auth, config }));
};
