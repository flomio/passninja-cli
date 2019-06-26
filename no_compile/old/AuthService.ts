import { config as awsConfig, CognitoIdentityCredentials, CognitoIdentityServiceProvider } from 'aws-sdk';

// import 'isomorphic-fetch';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession
} from 'amazon-cognito-identity-js';

import { Configuration } from './Configuration';
import { BehaviorSubject } from 'rxjs';


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

  get credentials() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.accessKeyId
      : undefined;
  }

  get accessKeyId() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.accessKeyId
      : '';
  }

  get secretAccessKey() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.secretAccessKey
      : '';
  }

  get sessionToken() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.sessionToken
      : '';
  }

  get expireTime() {
    return awsConfig.credentials instanceof CognitoIdentityCredentials
      ? awsConfig.credentials.expireTime
      : new Date();
  }

  get identityId() {
    return awsConfig.credentials &&
    (awsConfig.credentials as CognitoIdentityCredentials).identityId
      ? (awsConfig.credentials as CognitoIdentityCredentials).identityId
      : '';
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

  private provider = new CognitoIdentityServiceProvider({
    region: this.config.region
  });

  constructor(private config: Configuration) {
    awsConfig.region = this.config.region;
  }

  login = (USERNAME = AuthService.getUsername(), PASSWORD = AuthService.getPassword()) =>
    new Promise<CognitoIdentityCredentials>(async (resolve, reject) => {
      if (this.loggedIn) return resolve(awsConfig.credentials as CognitoIdentityCredentials);

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

      awsConfig.credentials = new CognitoIdentityCredentials({
        IdentityPoolId: this.config.identityPoolId,
        Logins: {
          [this.config.federation]: response.AuthenticationResult.IdToken
        }
      });

      (awsConfig.credentials as CognitoIdentityCredentials).get(err => {
        if (err) reject(err);
        this._loggedIn$.next(this.loggedIn);
        resolve({ ...awsConfig.credentials } as CognitoIdentityCredentials);
      });
    });

  update = () =>
    new Promise<CognitoIdentityCredentials>((resolve, reject) => {
      (awsConfig.credentials as CognitoIdentityCredentials).refresh(err => {
        if (err) {
          reject(err);
        }
        resolve(awsConfig.credentials as CognitoIdentityCredentials);
      });
    });
}

// get user() {
//   return this._userPool.getCurrentUser();
// }
//
// private _username?: string;
//
// private _userPool = new CognitoUserPool({
//   UserPoolId: this.config.userPoolId,
//   ClientId: this.config.userPoolClientId
// });
//
// login = async (username = AuthService.getUsername(), password = AuthService.getPassword()) => {
//   const session = await this.authenticateUser(username, password);
//   const creds = await this.authorizeUser(session);
//   return creds;
// };
//
// private authenticateUser = (username?: string, password?: string) =>
//   new Promise<CognitoUserSession>((resolve, reject) => {
//
//     let _username: string = username!;
//     if (!isString(_username)) {
//       _username = AuthService.getUsername();
//       if (!isString(_username)) {
//         reject(new Error('username required'));
//       }
//     }
//
//     let _password: string = password!;
//     if (!isString(_password)) {
//       _password = AuthService.getPassword();
//       if (!isString(_password)) {
//         reject(new Error('password required'));
//       }
//     }
//
//     const authenticationDetails = new AuthenticationDetails({
//       Username: _username,
//       Password: _password
//     });
//
//     const cognitoUser = new CognitoUser({
//       Username: _username,
//       Pool: this._userPool
//     });
//
//     cognitoUser.authenticateUser(authenticationDetails, {
//       onSuccess: result => {
//         this._username = username;
//         // this._refreshToken = result.getRefreshToken().getToken()
//         resolve(result);
//       },
//       onFailure: err => reject(err)
//     });
//   });
//
// private authorizeUser = (session: CognitoUserSession) =>
//   new Promise<CognitoIdentityCredentials>((resolve, reject) => {
//     if (!(session instanceof CognitoUserSession)) {
//       reject(new Error('invalid user session'));
//     }
//
//     awsConfig.credentials = new CognitoIdentityCredentials({
//       IdentityPoolId: this.config.identityPoolId,
//       Logins: {
//         [this.config.federation]: session.getIdToken().getJwtToken()
//       }
//     });
//
//     (awsConfig.credentials as CognitoIdentityCredentials).get(err => {
//       if (err) {
//         reject(err);
//       }
//       resolve(awsConfig.credentials as CognitoIdentityCredentials);
//     });
//   });
//
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
//
// }
