// import { AuthorizationService } from './AuthorizationService';
// import { initNewClient } from './IotService';
// import { Configuration } from './Configuration';
// import { CleanUpService } from './CleanUpService';
// import { CognitoIdentityCredentials } from 'aws-sdk';

import * as fs from 'fs';

import { Program } from '../bin/pn';
import { Reader } from './reader/Reader';
import { LocalSessionHandler } from './reader/sessions/LocalSessionHandler';
import { Configuration } from './Configuration';
import { AuthorizationService } from './AuthorizationService';

export const startScanner = (program: Program) => {
  const { username, password } = program;

  const config = new Configuration();

  const auth = new AuthorizationService(config, username, password);

  // const localSession = new LocalSessionHandler(config);

  // const readerSession = new Reader(localSession, config);

  // readerSession.start();

  // auth.login().then(() => initNewClient({ auth, config }));
};
