import { Inject } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { filter, take } from "rxjs/operators"
import * as AWS from "aws-sdk"
import * as util from "util"

import {} from "../../logging"
import { CONFIG_TOKEN } from "../../injection-tokens"

import { normalizedCredentials } from "./util"

export class AuthService {
  credentialsSubject: BehaviorSubject<any>

  signedRequest: (
    url: string,
    options: {
      method: "GET"
      resolveWithFullResponse: boolean
    }
  ) => Promise<any>

  constructor(@Inject(CONFIG_TOKEN) private options: any) {
    // TODO: should this not be set somewhere else? Probably in the config.ts
    AWS.config.region = this.options.awsResources.region
    this.credentialsSubject = new BehaviorSubject(null)
    this.configureSignedRequest()
  }

  configureSignedRequest = () => {
    const cognitoCredentials = await this.waitCredentials()
    const normalized = normalizedCredentials(cognitoCredentials)

    this.signedRequest = (url, options) => {
      return new Promise((resolve, reject) => {
        // set this auto-magically
        opts.aws = {
          session: normalized.sessionToken,
          sign_version: 4,
          service: "execute-api",
          region: this.options.awsResources.region,
          key: normalized.accessKeyId,
          secret: normalized.secretAccessKey
        }

        return [
          2 /*return*/,
          request_promise_native_1.default.apply(void 0, args)
        ]
      })
    }
  }

  login = () => {
    // return __awaiter(this, void 0, void 0, function () {
    //     var _a, cogIdpForInitAuthOnly, username, password, init, logins, creds, iot;
    //     return __generator(this, function (_b) {
    //         switch (_b.label) {
    //             case 0:
    //                 cogIdpForInitAuthOnly = new AWS.CognitoIdentityServiceProvider({
    //                     // Need mock creds ...
    //                     credentials: {
    //                         secretAccessKey: '_',
    //                         accessKeyId: '_'
    //                     },
    //                     region: this.options.awsResources.region
    //                 });
    //                 logging_1.dbg('Logging in', this.options.userCredentials);
    //                 // TODO: won't ever be null if a default is set
    //                 if (this.options.userCredentials == null) {
    //                     return [2 /*return*/];
    //                 }
    //                 username = this.options.userCredentials.user;
    //                 password = this.options.userCredentials.password;
    //                 // TODO: Actually create a `demo` account in the cloud formation ?
    //                 if (username === 'demo') {
    //                     return [2 /*return*/];
    //                 }
    //                 return [4 /*yield*/, cogIdpForInitAuthOnly.initiateAuth({
    //                         ClientId: this.options.awsResources.userPoolClient,
    //                         AuthFlow: 'USER_PASSWORD_AUTH',
    //                         AuthParameters: { USERNAME: username, PASSWORD: password }
    //                     }).promise()
    //                     // TODO: report this, store refresh token
    //                     // assume this was to try and tell TypeScript that the object was not null
    //                     // underneath
    //                 ];
    //             case 1:
    //                 init = _b.sent();
    //                 // TODO: report this, store refresh token
    //                 // assume this was to try and tell TypeScript that the object was not null
    //                 // underneath
    //                 if (init.AuthenticationResult == null) {
    //                     return [2 /*return*/];
    //                 }
    //                 logins = (_a = {},
    //                     _a['cognito-idp.' +
    //                         this.options.awsResources.region +
    //                         '.amazonaws.com/' + this.options.awsResources.userPool] = init.AuthenticationResult.IdToken,
    //                     _a);
    //                 creds = new AWS.CognitoIdentityCredentials({
    //                     Logins: logins,
    //                     IdentityPoolId: this.options.awsResources.identityPool
    //                 });
    //                 // TODO: schedule refresh on all of this
    //                 return [4 /*yield*/, util_1.promisify(creds.refresh.bind(creds))()];
    //             case 2:
    //                 // TODO: schedule refresh on all of this
    //                 _b.sent();
    //                 iot = new AWS.Iot({
    //                     region: this.options.awsResources.region,
    //                     credentials: creds
    //                 });
    //                 return [4 /*yield*/, iot.attachPrincipalPolicy({
    //                         policyName: this.options.awsResources.iotOwnThingsPolicy,
    //                         principal: creds.identityId
    //                     }).promise()
    //                     // this is an async method, which uses waitCredentials
    //                 ];
    //             case 3:
    //                 _b.sent();
    //                 // this is an async method, which uses waitCredentials
    //                 this.testCredentials();
    //                 // TODO: what about failing ?
    //                 // this.credentialsSubject.error()
    //                 this.credentialsSubject.next(creds);
    //                 logging_1.dbg('Logged in');
    //                 return [2 /*return*/];
    //         }
    //     });
    // });
  }

  /**
   *   TODO: what about will get credentials ?
   *   - have user/pass             YES (MAYBE)
   *     - successfully signed in   YES
   *     - failed to sign in        NO
   *   - have a refresh token       YES (MAYBE)
   *     - successfully signed in   YES
   *     - failed to sign in        NO
   */
  haveCredentials = () => this.credentialsSubject.getValue() != null

  waitCredentials = () => {
    return this.credentialsSubject
      .pipe(
        filter(c => !!c),
        take(1)
      )
      .toPromise()
  }

  /**
   * Only return non null credentials (the initial value is set to null)
   */
  credentialsStream = () => this.credentialsSubject.pipe(filter(c => !!c))

  noCredentials = () =>
    !(
      this.options.userCredentials.user && this.options.userCredentials.password
    )

  testCredentials = () =>
    this.signedRequest(`${this.options.demoBackend.baseUrl}/authd/test`, {
      method: "GET",
      resolveWithFullResponse: false
    }).then((resp: any) => {
      logging_1.dbg("Credentials OK")
      // console.log(JSON.stringify(JSON.parse(resp), null, 2))
    })
}
