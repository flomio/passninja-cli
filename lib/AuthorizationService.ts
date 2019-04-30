import {
  CognitoIdentityServiceProvider,
  CognitoIdentityCredentials,
  Credentials
} from 'aws-sdk';
import { BehaviorSubject } from 'rxjs';

import { cleanUpService } from './CleanUp';
import { Configuration } from './Configuration';

declare interface ConfigurationOptions {
  username?: string;
  password?: string;
}

export class AuthorizationService {
  get credentials() {
    return this._$credentials.getValue();
  }

  get $credentials() {
    return this._$credentials.asObservable();
  }

  private _cleanUp = cleanUpService;

  private _provider = new CognitoIdentityServiceProvider({
    region: this._config.region
  });

  private _credentials!: CognitoIdentityCredentials;

  private _$credentials = new BehaviorSubject<Credentials>({} as any);

  constructor(options?: ConfigurationOptions) {
    let username: string;
    if (!!options && options.username) username = options.username;
    else username = Configuration.getUsername();

    let password!: string;
    if (!!options && options.password) password = options.password;
    else password = Configuration.getPassword();

    let dirty = false;

    if (this._config.username !== username) {
      this._config.username = username;
      dirty = true;
    }

    if (this._config.password !== password) {
      this._config.password = password;
      dirty = true;
    }

    for (let key in this._config) {
      const value = this._config[key];

      if (!(value && value.length)) {
        throw new Error(`config.${key} must be defined in .env at build time`);
      }
    }

    if (dirty) {
      Configuration.saved = this._config;
    }

    console.log(_config);
    // this.setup().then(() => console.log(this.credentials));
    this._cleanUp.register(() => {
      this._$credentials.complete();
    });
  }

  update = async () => {
    await this._credentials.refreshPromise();
    this._$credentials.next(this._credentials);
    return this.credentials;
  };

  private setup = async () => {
    try {
      const response = await this._provider
        .initiateAuth({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this._config.userPoolClientId,
          AuthParameters: {
            USERNAME: this._config.username,
            PASSWORD: this._config.password
          }
        })
        .promise();

      console.log(response);

      if (!response.AuthenticationResult) {
        throw new Error('could not login to authentication provider');
      }

      if (!response.AuthenticationResult.IdToken) {
        throw new Error('authentication IdToken not present');
      }

      this._credentials = new CognitoIdentityCredentials({
        IdentityPoolId: this._config.identityPoolId,
        Logins: {
          [this._config.federation]: response.AuthenticationResult.IdToken
        }
      });
    } catch (err) {
      // console.error(err);
      throw err;
    }

    // not sure why this was in the original code or if it was dewebpacked correctly
    // await this.credentials.refreshPromise()

    this._$credentials.next(this._credentials);
  };
}
