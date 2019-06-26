"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const aws_sdk_1 = require("aws-sdk");
const amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
const rxjs_1 = require("rxjs");
const CleanUp_1 = require("./CleanUp");
const Configuration_1 = require("./Configuration");
const generateCSR_1 = require("./generateCSR");
global.fetch = require('node-fetch');
class AuthorizationService {
    constructor(options) {
        this.cleanUp = CleanUp_1.cleanUpService;
        this._$credentials = new rxjs_1.BehaviorSubject({});
        this.update = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const creds = this.credentials;
            yield creds.refreshPromise();
            return void this._$credentials.next(creds);
        });
        this.login = (Username, Password) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const self = this;
            return new Promise((resolve, reject) => {
                const userPool = new amazon_cognito_identity_js_1.CognitoUserPool({
                    UserPoolId: this.config.userPoolId,
                    ClientId: this.config.userPoolClientId
                });
                const user = new amazon_cognito_identity_js_1.CognitoUser({
                    Pool: userPool,
                    Username
                });
                const authData = new amazon_cognito_identity_js_1.AuthenticationDetails({
                    Username,
                    Password
                });
                user.authenticateUser(authData, {
                    onSuccess: result => {
                        aws_sdk_1.config.region = Configuration_1.CONFIG.region;
                        let creds = new aws_sdk_1.CognitoIdentityCredentials({
                            IdentityPoolId: Configuration_1.CONFIG.identityPoolId,
                            Logins: {
                                [Configuration_1.CONFIG.federation]: result.getIdToken().getJwtToken()
                            }
                        });
                        creds.refreshPromise().then(() => {
                            self._$credentials.next(creds);
                            resolve(creds);
                        }, err => reject(err));
                    },
                    onFailure: err => {
                        console.log(err);
                    }
                });
            });
        });
        this.setupIot = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                this.iot = new aws_sdk_1.Iot({
                    region: this.config.region,
                    credentials: this.credentials
                });
                let response = yield this.iot
                    .describeThing({ thingName: this.thingName })
                    .promise();
                console.log(response);
            }
            catch (err) {
                console.log(`creating a new device named ${this.thingName}`);
                // await this.iot
                //   .createThing({
                //     thingName: this.thingName
                //   })
                //   .promise();
            }
        });
        this.setupSsl = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            // TODO: double check what type of ID should be used as a parameter
            const certRequest = generateCSR_1.generateCSR(this.credentials.accessKeyId);
            const cert = yield this.iot
                .createCertificateFromCsr({
                setAsActive: true,
                certificateSigningRequest: certRequest.csr
            })
                .promise();
            yield this.iot
                .attachThingPrincipal({
                thingName: this.thingName,
                principal: cert.certificateArn
            })
                .promise();
            yield this.iot
                .attachPrincipalPolicy({
                policyName: this.config.iotThingsOwnPolicy,
                principal: cert.certificateArn
            })
                .promise();
        });
        const { config = Configuration_1.CONFIG, username = AuthorizationService.getUsername(), password = AuthorizationService.getPassword() } = options || {};
        this.config = config;
        aws_sdk_1.config.region = this.config.region;
        this.login(username, password).then(this.setupIot);
        // .then(this.setupSsl);
        this.cleanUp.register(() => {
            this._$credentials.complete();
        });
    }
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
}
exports.AuthorizationService = AuthorizationService;
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
//# sourceMappingURL=AuthorizationService.js.map