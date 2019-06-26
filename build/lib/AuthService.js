"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("isomorphic-fetch");
var aws_sdk_1 = require("aws-sdk");
var rxjs_1 = require("rxjs");
var isString = function (obj) { return typeof obj === 'string' && !!obj.length; };
var AuthService = /** @class */ (function () {
    function AuthService(config) {
        var _this = this;
        this.config = config;
        this._loggedIn$ = new rxjs_1.BehaviorSubject(this.loggedIn);
        this.provider = new aws_sdk_1.CognitoIdentityServiceProvider({
            region: this.config.region
        });
        this.login = function (USERNAME, PASSWORD) {
            if (USERNAME === void 0) { USERNAME = AuthService.getUsername(); }
            if (PASSWORD === void 0) { PASSWORD = AuthService.getPassword(); }
            return new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var response;
                var _a;
                var _this = this;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (this.loggedIn)
                                return [2 /*return*/, resolve(aws_sdk_1.config.credentials)];
                            return [4 /*yield*/, this.provider
                                    .initiateAuth({
                                    AuthFlow: 'USER_PASSWORD_AUTH',
                                    ClientId: this.config.userPoolClientId,
                                    AuthParameters: {
                                        USERNAME: USERNAME,
                                        PASSWORD: PASSWORD
                                    }
                                })
                                    .promise()];
                        case 1:
                            response = _b.sent();
                            if (!response.AuthenticationResult) {
                                throw new Error('could not login to authentication provider');
                            }
                            if (!response.AuthenticationResult.IdToken) {
                                throw new Error('authentication IdToken not present');
                            }
                            aws_sdk_1.config.credentials = new aws_sdk_1.CognitoIdentityCredentials({
                                IdentityPoolId: this.config.identityPoolId,
                                Logins: (_a = {},
                                    _a[this.config.federation] = response.AuthenticationResult.IdToken,
                                    _a)
                            });
                            aws_sdk_1.config.credentials.get(function (err) {
                                if (err)
                                    reject(err);
                                _this._loggedIn$.next(_this.loggedIn);
                                resolve(tslib_1.__assign({}, aws_sdk_1.config.credentials));
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        this.update = function () {
            return new Promise(function (resolve, reject) {
                aws_sdk_1.config.credentials.refresh(function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(aws_sdk_1.config.credentials);
                });
            });
        };
        aws_sdk_1.config.region = this.config.region;
    }
    Object.defineProperty(AuthService.prototype, "credentials", {
        get: function () {
            return aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials
                ? aws_sdk_1.config.credentials.accessKeyId
                : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "accessKeyId", {
        get: function () {
            return aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials
                ? aws_sdk_1.config.credentials.accessKeyId
                : '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "secretAccessKey", {
        get: function () {
            return aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials
                ? aws_sdk_1.config.credentials.secretAccessKey
                : '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "sessionToken", {
        get: function () {
            return aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials
                ? aws_sdk_1.config.credentials.sessionToken
                : '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "expireTime", {
        get: function () {
            return aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials
                ? aws_sdk_1.config.credentials.expireTime
                : new Date();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "identityId", {
        get: function () {
            return aws_sdk_1.config.credentials &&
                aws_sdk_1.config.credentials.identityId
                ? aws_sdk_1.config.credentials.identityId
                : '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "loggedIn", {
        get: function () {
            return (aws_sdk_1.config.credentials instanceof aws_sdk_1.CognitoIdentityCredentials &&
                !aws_sdk_1.config.credentials.expired);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthService.prototype, "loggedIn$", {
        get: function () {
            return this._loggedIn$.asObservable();
        },
        enumerable: true,
        configurable: true
    });
    AuthService.getUsername = function () {
        /**
         *
         * Add inquirer module to prompt user at the command line
         *
         */
        return 'demo@user.com';
    };
    AuthService.getPassword = function () {
        /**
         *
         * Add inquirer module to prompt user at the command line
         *
         */
        return 'Password123!';
    };
    return AuthService;
}());
exports.AuthService = AuthService;
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
//# sourceMappingURL=AuthService.js.map