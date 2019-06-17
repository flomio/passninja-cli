
import { AuthService } from './AuthService';
import { Configuration } from './Configuration';

describe('AuthService', () => {
  const auth = new AuthService(new Configuration());

  it('should be able to login', done => {
    auth.login().then((creds) => {
      // console.log(creds);
      done();
    });
  });
});
