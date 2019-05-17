import {
  config as awsConfig,
  CognitoIdentityCredentials,
  Iot,
  CognitoIdentityServiceProvider
} from 'aws-sdk';

import { BehaviorSubject } from 'rxjs';

import { CleanUpService } from './CleanUpService';
import { Configuration } from './Configuration';
import { updateClientCredentials, initNewClient } from './IotService';

export declare interface AuthorizationServiceOptions {
  username?: string;
  password?: string;
  config: Configuration;
}

export class AuthorizationService {

  credentials: CognitoIdentityCredentials = {} as any;

  private provider: CognitoIdentityServiceProvider;

  constructor(private config: Configuration) {
    awsConfig.region = this.config.region;

    this.provider = new CognitoIdentityServiceProvider({
      region: this.config.region
    });
  }

  update = async () => {
    await this.credentials.refreshPromise();
    updateClientCredentials(this.credentials);
  };

  login = () =>
    new Promise(async (resolve, reject) => {
      const response = await this.provider
        .initiateAuth({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.config.userPoolClientId,
          AuthParameters: {
            USERNAME: this.config.username,
            PASSWORD: this.config.password
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
