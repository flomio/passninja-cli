import {
  config as awsConfig,
  CognitoIdentityCredentials,
  Iot,
  CognitoIdentityServiceProvider
} from 'aws-sdk';
import { BehaviorSubject } from 'rxjs';

import { cleanUpService } from './CleanUp';
import { CONFIG, Configuration } from './Configuration';
import { generateCSR } from './generateCSR';
import { CognitoIdentityProvider } from 'cloudform-types/types/cognito/identityPool';

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
    return 'demo@user.com'; // 'demo@user.com';
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
  private provider: CognitoIdentityServiceProvider;
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

    this.provider = new CognitoIdentityServiceProvider({
      region: this.config.region
    });

    this.login(username, password)
      .then(this.setupIot)
      .then(this.setupSsl);

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

  private setupIot = async () => {
    try {
      this.iot = new Iot({
        region: this.config.region,
        credentials: this.credentials
      });

      await this.iot
        .createThing({
          thingName: this.thingName
        })
        .promise();
    } catch (err) {
      console.error(`>>> setupIot ERROR >>> ${err}`);
    }
  };

  // private createThing = async () => {
  //   const response = await this.iot
  //     .createThing({
  //       thingName: this.thingName
  //       // attributePayload: {
  //       //   attributes: {
  //       //     valid: 'true'
  //       //   }
  //       // }
  //     })
  //     .promise();

  //   console.log(response);
  // };

  private setupSsl = async () => {
    try {
      // TODO: double check what type of ID should be used as a parameter
      const { csr } = generateCSR(this.credentials.accessKeyId);

      const { certificateArn } = await this.iot
        .createCertificateFromCsr({
          setAsActive: true,
          certificateSigningRequest: csr
        })
        .promise();

      await this.iot
        .attachThingPrincipal({
          thingName: this.thingName,
          principal: certificateArn!
        })
        .promise();

      let result = await this.iot
        .attachPrincipalPolicy({
          policyName: this.config.scannerPolicy,
          principal: certificateArn!
        })
        .promise();

      console.log(result);
    } catch (err) {
      console.error(`>>> setupSsl ERROR >>> ${err}`);
    }
  };
}
