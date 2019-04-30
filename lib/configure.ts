import { Program } from 'bin/pn';

import { config } from './Configuration';
import { AuthorizationService } from './AuthorizationService';

export const configure = (program: Program) => {
  console.log(config);
  // const auth = new AuthorizationService(config);
};
