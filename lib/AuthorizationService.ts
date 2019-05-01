import {
  CognitoIdentityServiceProvider,
  CognitoIdentityCredentials,
  Credentials
} from 'aws-sdk';
import { BehaviorSubject } from 'rxjs';

import { cleanUpService } from './CleanUp';
import { config as CONFIG, Configuration } from './Configuration';

declare interface AuthorizationServiceOptions {
  username?: string;
  password?: string;
  config: Configuration;
}

export class AuthorizationService {
  static getUsername() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'demo@user.com';
  }

  static getPassword() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'Pass!@#$334--';
  }

  get credentials() {
    return this._$credentials.getValue();
  }

  get $credentials() {
    return this._$credentials.asObservable();
  }

  private cleanUp = cleanUpService;

  private config: Configuration;

  private provider: CognitoIdentityServiceProvider;

  private _$credentials = new BehaviorSubject<CognitoIdentityCredentials>(
    {} as any
  );

  constructor({
    config = CONFIG,
    username = AuthorizationService.getUsername(),
    password = AuthorizationService.getPassword()
  }: AuthorizationServiceOptions) {
    this.config = config;

    this.provider = new CognitoIdentityServiceProvider({
      region: this.config.region
    });

    this.login(username, password).then(() => console.log(this.credentials));

    this.cleanUp.register(() => {
      this._$credentials.complete();
    });
  }

  update = async () => {
    const creds = this.credentials;
    await creds.refreshPromise();
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

      this._$credentials.next(
        new CognitoIdentityCredentials({
          IdentityPoolId: this.config.identityPoolId,
          Logins: {
            [this.config.federation]: response.AuthenticationResult.IdToken
          }
        })
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
