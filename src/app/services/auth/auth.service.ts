// var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
// var AWS = __importStar(__webpack_require__(/*! aws-sdk */ \"./node_modules/aws-sdk/lib/aws.js\"));
import * as AWS from './node_modules/aws-sdk'
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
import {} from '../../../../compiled-src/injection-tokens'
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");

var util_1 = __webpack_require__(/*! util */ \"util\");

var request_promise_native_1 = __importDefault(__webpack_require__(/*! request-promise-native */ \"./node_modules/request-promise-native/lib/rp.js\"));

var rxjs_1 = __webpack_require__(/*! rxjs */ \"./node_modules/rxjs/_esm5/index.js\");

var operators_1 = __webpack_require__(/*! rxjs/operators */ \"./node_modules/rxjs/_esm5/operators/index.js\");

var util_2 = __webpack_require__(/*! ./util */ \"./src/services/auth/util.ts\");
/**
 * These needs thinking through again.
 * On sign-in to cognito idp, you can get a refresh token
 * Refresh token allows you to sign in again and get more idTokens (jwt)
 * The idToken allows you to get cognito federated identity IAM credentials
 * Need to monitor the expiry of all tokens and refresh
 * Credentials should be more of an rxjs subject
 *
 */
var AuthService = /** @class */ (function () {
    function AuthService(options) {
        this.options = options;
        this.credentialsSubject = new rxjs_1.BehaviorSubject(null);
        // TODO: should this not be set somewhere else? Probably in the config.ts
        AWS.config.region = options.awsResources.region;
        this.configureSignedRequest();
    }
    AuthService.prototype.waitCredentials = function () {
        return this.credentialsSubject
            .pipe(operators_1.filter(function (c) { return !!c; }), operators_1.take(1))
            .toPromise();
    };
    /**
     * Only return non null credentials (the initial value is set to null)
     */
    AuthService.prototype.credentialsStream = function () {
        return this.credentialsSubject.pipe(operators_1.filter(function (c) { return !!c; }));
    };
    /**
     *   TODO: what about will get credentials ?
     *   - have user/pass             YES (MAYBE)
     *     - successfully signed in   YES
     *     - failed to sign in        NO
     *   - have a refresh token       YES (MAYBE)
     *     - successfully signed in   YES
     *     - failed to sign in        NO
     */
    AuthService.prototype.haveCredentials = function () {
        return this.credentialsSubject.getValue() != null;
    };
    AuthService.prototype.configureSignedRequest = function () {
        var _this = this;
        this.signedRequest = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var opts, cognitoCredentials, normalized;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            opts = args.find(function (o) { return typeof o === 'object'; });
                            // Handle case of single string params implying a GET request
                            if (opts == null) {
                                opts = {};
                                args.push(opts);
                            }
                            return [4 /*yield*/, this.waitCredentials()];
                        case 1:
                            cognitoCredentials = _a.sent();
                            normalized = util_2.normalizedCredentials(cognitoCredentials);
                            // set this auto-magically
                            opts.aws = {
                                session: normalized.sessionToken,
                                sign_version: 4,
                                key: normalized.accessKeyId,
                                secret: normalized.secretAccessKey
                            };
                            return [2 /*return*/, request_promise_native_1.default.apply(void 0, args)];
                    }
                });
            });
        });
    };
    AuthService.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, cogIdpForInitAuthOnly, username, password, init, logins, creds, iot;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cogIdpForInitAuthOnly = new AWS.CognitoIdentityServiceProvider({ region: this.options.awsResources.region });
                        logging_1.dbg('logging in', this.options.userCredentials);
                        // TODO: won't ever be null if a default is set
                        if (this.options.userCredentials == null) {
                            return [2 /*return*/];
                        }
                        username = this.options.userCredentials.user;
                        password = this.options.userCredentials.password;
                        // TODO: Actually create a `demo` account in the cloud formation ?
                        if (username === 'demo') {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, cogIdpForInitAuthOnly.initiateAuth({
                                ClientId: this.options.awsResources.userPoolClient,
                                AuthFlow: 'USER_PASSWORD_AUTH',
                                AuthParameters: { USERNAME: username, PASSWORD: password }
                            }).promise()
                            // TODO: report this, store refresh token
                            // assume this was to try and tell TypeScript that the object was not null
                            // underneath
                        ];
                    case 1:
                        init = _b.sent();
                        // TODO: report this, store refresh token
                        // assume this was to try and tell TypeScript that the object was not null
                        // underneath
                        if (init.AuthenticationResult == null) {
                            return [2 /*return*/];
                        }
                        logins = (_a = {},
                            _a['cognito-idp.' +
                                this.options.awsResources.region +
                                '.amazonaws.com/' + this.options.awsResources.userPool] = init.AuthenticationResult.IdToken,
                            _a);
                        creds = new AWS.CognitoIdentityCredentials({
                            Logins: logins,
                            IdentityPoolId: this.options.awsResources.identityPool
                        });
                        // TODO: schedule refresh on all of this
                        return [4 /*yield*/, util_1.promisify(creds.refresh.bind(creds))()];
                    case 2:
                        // TODO: schedule refresh on all of this
                        _b.sent();
                        iot = new AWS.Iot({ credentials: creds });
                        return [4 /*yield*/, iot.attachPrincipalPolicy({
                                policyName: this.options.awsResources.iotOwnThingsPolicy,
                                principal: creds.identityId
                            }).promise()
                            // this is an async method, which uses waitCredentials
                        ];
                    case 3:
                        _b.sent();
                        // this is an async method, which uses waitCredentials
                        this.testCredentials();
                        // TODO: what about failing ?
                        // this.credentialsSubject.error()
                        this.credentialsSubject.next(creds);
                        logging_1.dbg('Logged in');
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.testCredentials = function () {
        this.signedRequest(this.options.demoBackend.baseUrl + \"/authd/test\", {
            method: 'GET',
            resolveWithFullResponse: false
        }).then(function (resp) {
            logging_1.dbg('Credentials OK');
            // console.log(JSON.stringify(JSON.parse(resp), null, 2))
        });
    };
    AuthService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object])
    ], AuthService);
    return AuthService;
}());



// var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
//     var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
//     if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
//     else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
//     return c > 3 && r && Object.defineProperty(target, key, r), r;
// };
// var __metadata = (this && this.__metadata) || function (k, v) {
//     if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
// };
// var __param = (this && this.__param) || function (paramIndex, decorator) {
//     return function (target, key) { decorator(target, key, paramIndex); }
// };
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// var __generator = (this && this.__generator) || function (thisArg, body) {
//     var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
//     return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;
//     function verb(n) { return function (v) { return step([n, v]); }; }
//     function step(op) {
//         if (f) throw new TypeError(\"Generator is already executing.\");
//         while (_) try {
//             if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
//             if (y = 0, t) op = [op[0] & 2, t.value];
//             switch (op[0]) {
//                 case 0: case 1: t = op; break;
//                 case 4: _.label++; return { value: op[1], done: false };
//                 case 5: _.label++; y = op[1]; op = [0]; continue;
//                 case 7: op = _.ops.pop(); _.trys.pop(); continue;
//                 default:
//                     if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
//                     if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
//                     if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
//                     if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
//                     if (t[2]) _.ops.pop();
//                     _.trys.pop(); continue;
//             }
//             op = body.call(thisArg, _);
//         } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
//         if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
//     }
// };
// var __importStar = (this && this.__importStar) || function (mod) {
//     if (mod && mod.__esModule) return mod;
//     var result = {};
//     if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
//     result[\"default\"] = mod;
//     return result;
// };
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { \"default\": mod };
// };
// exports.AuthService = AuthService;
//# sourceURL=webpack://commonjs/./src/services/auth/auth.service.ts?"
