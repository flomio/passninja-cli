import {
  config as awsConfig,
  CognitoIdentityCredentials,
  Iot,
  CognitoIdentityServiceProvider
} from 'aws-sdk';

import { BehaviorSubject } from 'rxjs';

import { CleanUpService } from './CleanUpService';
import { Configuration } from './Configuration';

export declare interface AuthorizationServiceOptions {
  username?: string;
  password?: string;
  config: Configuration;
}

export declare type PassNinjaCredentials = CognitoIdentityCredentials | {};

export class AuthorizationService {
  get credentials() {
    return this._$credentials.getValue();
  }

  get $credentials() {
    return this._$credentials.asObservable();
  }

  private provider: CognitoIdentityServiceProvider;

  private _$credentials = new BehaviorSubject<PassNinjaCredentials>({});

  constructor(private config: Configuration, private cleanUp: CleanUpService) {
    awsConfig.region = this.config.region;

    this.provider = new CognitoIdentityServiceProvider({
      region: this.config.region
    });

    this.login(this.config.username, this.config.password);

    this.cleanUp.register(() => {
      this._$credentials.complete();
      console.log('cleaned up AuthorizationService');
    });
  }

  update = async () => {
    const creds = this.credentials;
    await (creds as CognitoIdentityCredentials).refreshPromise();
    return void this._$credentials.next(creds);
  };

  private login = async (USERNAME: string, PASSWORD: string) => {
    try {
      const response = await this.provider
        .initiateAuth({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.config.userPoolClientId,
          AuthParameters: {
            USERNAME,
            PASSWORD
          }
        })
        .promise();

      if (!response.AuthenticationResult) {
        throw new Error('could not login to authentication provider');
      }

      if (!response.AuthenticationResult.IdToken) {
        throw new Error('authentication IdToken not present');
      }

      const creds = new CognitoIdentityCredentials({
        IdentityPoolId: this.config.identityPoolId,
        Logins: {
          [this.config.federation]: response.AuthenticationResult.IdToken
        }
      });

      await creds.refreshPromise();

      this._$credentials.next(creds);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
