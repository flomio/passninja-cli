import { CognitoIdentityCredentials, config as awsConfig } from 'aws-sdk';
import { ConfigurationService } from './ConfigurationService';
import { AuthService } from './AuthService';

jest.setTimeout(20000);

describe('AuthService', () => {
  let auth: AuthService;
  const config = new ConfigurationService();

  beforeEach(() => {
    if (awsConfig.credentials instanceof CognitoIdentityCredentials) {
      awsConfig.credentials.clearCachedId();
      awsConfig.credentials = null;
    }

    auth = new AuthService(config);
  });

  it('should be able to login', async () => {
    expect(auth.loggedIn).toEqual(false);
    const creds = await auth.login('demo@user.com', 'Password123!');
    expect(auth.loggedIn).toEqual(true);
  });
});
