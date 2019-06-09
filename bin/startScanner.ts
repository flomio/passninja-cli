import { Program } from './pn';
import { Configuration } from '../lib/Configuration';
import { AuthorizationService } from '../lib/AuthorizationService';
import { initNewClient, publish } from '../lib/IotService';
import { Reader } from '../lib/Reader';
import { SessionHandler } from '../lib/SessionHandler';

export const startScanner = (program: Program) => {
  const { username, password } = program;

  const config = new Configuration();

  const auth = new AuthorizationService(config, username, password);

  auth
    .login()
    .then(() => {
      initNewClient({ auth, config });

      publish('testing', 'testing 1, 2, 3....');

      const localSession = new SessionHandler(config);

      // @ts-ignore
      const readerSession = new Reader(localSession, config);

      readerSession.start();

      console.log('started');
    })
    .catch(err => console.error(`>>> ERROR auth.login() >>> ${err}`));
};
