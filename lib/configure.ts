import { Program } from 'bin/pn';

import { AuthorizationService } from './AuthorizationService';
import { initNewClient } from './IotService';
import { Configuration } from './Configuration';
import { CleanUpService } from './CleanUpService';
import { CognitoIdentityCredentials } from 'aws-sdk';

export const configure = (program: Program) => {
  const { username, password } = program;

  const config = new Configuration();

  const auth = new AuthorizationService(config, username, password);

  auth.login().then(() => initNewClient({ auth, config }));
};
