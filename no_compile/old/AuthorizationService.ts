import {
  config as awsConfig,
  CognitoIdentityCredentials,
  CognitoIdentityServiceProvider
} from 'aws-sdk';

import { Configuration } from './Configuration';
import { updateClientCredentials } from './IotService';

export class AuthorizationService {
  private static getUsername = () => {
    /**
     *
     * Add inquirer module to prompt user at the command line
     *
     */
    return 'demo@user.com';
  };

  private static getPassword = () => {
    /**
     *
     * Add inquirer module to prompt user at the command line
     *
     */
    return 'Password123!';
  };

  credentials!: CognitoIdentityCredentials;

  private provider = new CognitoIdentityServiceProvider({
    region: this.config.region
  });

  constructor(
    private config: Configuration,
    private username: string = AuthorizationService.getUsername(),
    private password: string = AuthorizationService.getPassword()
  ) {
    awsConfig.region = this.config.region;
  }

  update = () =>
    new Promise<CognitoIdentityCredentials>(async (resolve, reject) => {
      this.credentials.refresh((err?: Error) => {
        if (err) reject(err);
        updateClientCredentials(this.credentials);
        resolve(this.credentials);
      });
    });

  login = () =>
    new Promise<CognitoIdentityCredentials>(async (resolve, reject) => {
      const response = await this.provider
        .initiateAuth({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.config.userPoolClientId,
          AuthParameters: {
            USERNAME: this.username,
            PASSWORD: this.password
          }
        })
        .promise();

      if (!response.AuthenticationResult) {
        throw new Error('could not login to authentication provider');
      }

      if (!response.AuthenticationResult.IdToken) {
        throw new Error('authentication IdToken not present');
      }

      awsConfig.credentials = new CognitoIdentityCredentials({
        IdentityPoolId: this.config.identityPoolId,
        Logins: {
          [this.config.federation]: response.AuthenticationResult.IdToken
        }
      });

      (awsConfig.credentials as CognitoIdentityCredentials).get(err => {
        if (err) reject(err);
        this.credentials = awsConfig.credentials as CognitoIdentityCredentials;
        resolve(this.credentials);
      });
    });
}
