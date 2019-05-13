import { Program } from 'bin/pn';

import { AuthorizationService } from './AuthorizationService';
import { IotService } from './IotService';
import { Configuration } from './Configuration';
import { CleanUpService } from './CleanUpService';

export const configure = (program: Program) => {
  const { username, password } = program;

  const cleanUp = new CleanUpService();

  const config = new Configuration({ username, password });

  const auth = new AuthorizationService(config, cleanUp);

  const client = new IotService(config, auth, cleanUp);
};
