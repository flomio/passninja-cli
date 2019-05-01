import { Program } from 'bin/pn';

import { AuthorizationService } from './AuthorizationService';

export const configure = (program: Program) => {
  const auth = new AuthorizationService();
};
