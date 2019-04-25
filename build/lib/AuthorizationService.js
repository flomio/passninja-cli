"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const aws_sdk_1 = require("aws-sdk");
const rxjs_1 = require("rxjs");
const CleanUp_1 = require("./CleanUp");
class AuthorizationService {
    constructor(_config) {
        this._config = _config;
        this._cleanUp = CleanUp_1.cleanUpService;
        this._provider = new aws_sdk_1.CognitoIdentityServiceProvider({
            region: this._config.region
        });
        this._$credentials = new rxjs_1.BehaviorSubject({});
        this.update = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._credentials.refreshPromise();
            this._$credentials.next(this._credentials);
            return this.credentials;
        });
        this.setup = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const response = yield this._provider
                .initiateAuth({
                ClientId: this._config.userPoolClientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: this._config.username,
                    PASSWORD: this._config.password
                }
            })
                .promise();
            if (!response.AuthenticationResult) {
                throw new Error('could not login to authentication provider. check username and password');
            }
            this._credentials = new aws_sdk_1.CognitoIdentityCredentials({
                IdentityPoolId: this._config.identityPoolId,
                Logins: {
                    [this._config.federation]: response.AuthenticationResult.IdToken
                }
            });
            // not sure why this was in the original code or if it was dewebpacked correctly
            // await this.credentials.refreshPromise()
            this._$credentials.next(this._credentials);
        });
        this.setup().then(() => console.log('logged in'));
        this._cleanUp.register(() => {
            this._$credentials.complete();
        });
    }
    get credentials() {
        return this._$credentials.getValue();
    }
    get $credentials() {
        return this._$credentials.asObservable();
    }
}
exports.AuthorizationService = AuthorizationService;
//# sourceMappingURL=AuthorizationService.js.map