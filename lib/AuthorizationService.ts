import { config as awsConfig, CognitoIdentityCredentials, Iot } from 'aws-sdk';

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';

import { BehaviorSubject } from 'rxjs';

import { cleanUpService } from './CleanUp';
import { CONFIG, Configuration } from './Configuration';
import { generateCSR } from './generateCSR';

declare interface AuthorizationServiceOptions {
  username?: string;
  password?: string;
  config: Configuration;
}

(global as any).fetch = require('node-fetch');

export class AuthorizationService {
  static getUsername() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'matt@flomio.com'; // 'demo@user.com';
  }

  static getPassword() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'Password123!'; // 'Pass!@#$334--';
  }

  get thingName() {
    return `pn-cli::${this.config.stack}::${this.credentials.identityId}`;
  }

  get credentials() {
    return this._$credentials.getValue();
  }

  get $credentials() {
    return this._$credentials.asObservable();
  }

  private cleanUp = cleanUpService;

  private config: Configuration;

  private iot!: Iot;

  private _$credentials = new BehaviorSubject<CognitoIdentityCredentials>(
    {} as any
  );

  constructor(options?: AuthorizationServiceOptions) {
    const {
      config = CONFIG,
      username = AuthorizationService.getUsername(),
      password = AuthorizationService.getPassword()
    } = options || {};

    this.config = config;

    awsConfig.region = this.config.region;

    this.login(username, password).then(this.setupIot);
    // .then(this.setupSsl);

    this.cleanUp.register(() => {
      this._$credentials.complete();
    });
  }

  update = async () => {
    const creds = this.credentials;
    await creds.refreshPromise();
    return void this._$credentials.next(creds);
  };

  private login = async (Username: string, Password: string) => {
    const self = this;
    return new Promise<CognitoIdentityCredentials>((resolve, reject) => {
      const userPool = new CognitoUserPool({
        UserPoolId: this.config.userPoolId,
        ClientId: this.config.userPoolClientId
      });

      const user = new CognitoUser({
        Pool: userPool,
        Username
      });

      const authData = new AuthenticationDetails({
        Username,
        Password
      });

      user.authenticateUser(authData, {
        onSuccess: result => {
          awsConfig.region = CONFIG.region;

          let creds = new CognitoIdentityCredentials({
            IdentityPoolId: CONFIG.identityPoolId,
            Logins: {
              [CONFIG.federation]: result.getIdToken().getJwtToken()
            }
          });

          creds.refreshPromise().then(
            () => {
              self._$credentials.next(creds);
              resolve(creds);
            },
            err => reject(err)
          );
        },
        onFailure: err => {
          console.log(err);
        }
      });
    });
  };

  private setupIot = async () => {
    try {
      this.iot = new Iot({
        region: this.config.region,
        credentials: this.credentials
      });

      let response = await this.iot
        .describeThing({ thingName: this.thingName })
        .promise();

      console.log(response);
    } catch (err) {
      console.log(`creating a new device named ${this.thingName}`);

      // await this.iot
      //   .createThing({
      //     thingName: this.thingName
      //   })
      //   .promise();
    }
  };

  private setupSsl = async () => {
    // TODO: double check what type of ID should be used as a parameter
    const certRequest = generateCSR(this.credentials.accessKeyId);

    const cert = await this.iot
      .createCertificateFromCsr({
        setAsActive: true,
        certificateSigningRequest: certRequest.csr
      })
      .promise();

    await this.iot
      .attachThingPrincipal({
        thingName: this.thingName,
        principal: cert.certificateArn!
      })
      .promise();

    await this.iot
      .attachPrincipalPolicy({
        policyName: this.config.iotThingsOwnPolicy,
        principal: cert.certificateArn!
      })
      .promise();
  };
}

// private login = async (USERNAME: string, PASSWORD: string) => {
//   try {
//     const response = await this.provider
//       .initiateAuth({
//         AuthFlow: 'USER_PASSWORD_AUTH',
//         ClientId: this.config.userPoolClientId,
//         AuthParameters: {
//           USERNAME,
//           PASSWORD
//         }
//       })
//       .promise();

//     if (!response.AuthenticationResult) {
//       throw new Error('could not login to authentication provider');
//     }

//     if (!response.AuthenticationResult.IdToken) {
//       throw new Error('authentication IdToken not present');
//     }

//     console.log(
//       new CognitoIdentityCredentials({
//         IdentityPoolId: this.config.identityPoolId,
//         Logins: {
//           [this.config.federation]: response.AuthenticationResult.IdToken
//         }
//       })
//     );

//     this._$credentials.next(
//       new CognitoIdentityCredentials({
//         IdentityPoolId: this.config.identityPoolId,
//         Logins: {
//           [this.config.federation]: response.AuthenticationResult.IdToken
//         }
//       })
//     );
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };
