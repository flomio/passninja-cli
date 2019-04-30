import { Program } from 'bin/pn';

import { Configuration } from './Configuration';

export const configure = (program: Program) => {
  const { username, password } = program;

  const config = new Configuration({ username, password });
};
