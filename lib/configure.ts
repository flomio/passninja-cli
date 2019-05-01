import { Program } from 'bin/pn';

import { config } from './Configuration';
import { AuthorizationService } from './AuthorizationService';

export const configure = (program: Program) => {
  const auth = new AuthorizationService({ config });
};
