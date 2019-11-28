import { BehaviorSubject } from 'rxjs';
import {
  config as awsConfig,
  CognitoIdentityCredentials,
  CognitoIdentityServiceProvider
} from 'aws-sdk';

import { ConfigurationService } from './ConfigurationService';

const getProp = <T extends keyof CognitoIdentityCredentials>(name: T) =>
  awsConfig.credentials instanceof CognitoIdentityCredentials
    ? awsConfig.credentials[name]
    : '';

export class AuthService {
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

  get accessKeyId() {
    return getProp('accessKeyId');
  }

  get secretAccessKey() {
    return getProp('secretAccessKey');
  }

  get sessionToken() {
    return getProp('sessionToken');
  }

  get identityId() {
    return getProp('identityId');
  }

  get expireTime() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.expireTime
      : new Date();
  }

  get loggedIn() {
    return (
      awsConfig.credentials instanceof CognitoIdentityCredentials &&
      !awsConfig.credentials.expired
    );
  }

  get loggedIn$() {
    return this._loggedIn$.asObservable();
  }

  private _loggedIn$ = new BehaviorSubject(this.loggedIn);

  constructor(private config: ConfigurationService) {
    awsConfig.update({
      region: this.config.region,
      credentials: new CognitoIdentityCredentials({
        IdentityPoolId: this.config.identityPoolId
      })
    });
  }

  login = (
    USERNAME = AuthService.getUsername(),
    PASSWORD = AuthService.getPassword()
  ) =>
    new Promise<CognitoIdentityCredentials>(async (resolve, reject) => {
      const finalize = () => {
        if (!this._loggedIn$.getValue()) {
          this._loggedIn$.next(true);
        }
        return resolve(awsConfig.credentials as CognitoIdentityCredentials);
      };

      if (this.loggedIn) {
        return finalize();
      }

      await (awsConfig.credentials as CognitoIdentityCredentials).getPromise();

      const provider = new CognitoIdentityServiceProvider({
        region: this.config.region,
        credentials: awsConfig.credentials
      });

      const response = await provider
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

      (awsConfig.credentials as any).params.Logins = {};

      (awsConfig.credentials as any).params.Logins[this.config.federation] =
        response.AuthenticationResult.IdToken;

      (awsConfig.credentials as CognitoIdentityCredentials).expired = true;

      (awsConfig.credentials as CognitoIdentityCredentials).get(err => {
        if (err) reject(err);
        finalize();
      });
    });

  // logout = () =>
  //   new Promise((resolve, reject) => {
  //     try {
  //       if (this.user) {
  //         this.user.signOut();
  //       }
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });

  update = () =>
    new Promise((resolve, reject) => {
      (awsConfig.credentials as CognitoIdentityCredentials).refresh(err => {
        if (err) {
          reject(err);
        }
        resolve(awsConfig.credentials as CognitoIdentityCredentials);
      });
    });

  cleanUp = () => {
    if (!this._loggedIn$.closed) {
      this._loggedIn$.complete();
    }
  };
}
