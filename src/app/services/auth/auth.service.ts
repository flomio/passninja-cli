import { Inject } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { filter, take } from "rxjs/operators"
import { promisify } from "util"

import {} from "../../logging"
import { CONFIG_TOKEN } from "../../injection-tokens"

import { normalizedCredentials } from "./util"

import {
  config as CONFIG,
  Iot,
  CognitoIdentityCredentials,
  CognitoIdentityServiceProvider
} from "aws-sdk"

export class AuthService {
  credentialsSubject: BehaviorSubject<
    CognitoIdentityCredentials | false
  > = new BehaviorSubject(false)

  signedRequest: (
    url: string,
    options: {
      method: "GET"
      resolveWithFullResponse: boolean
    }
  ) => Promise<any>

  constructor(@Inject(CONFIG_TOKEN) private options: any) {
    // TODO: should this not be set somewhere else? Probably in the config.ts
    CONFIG.region = this.options.awsResources.region
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

  login = async () => {
    const cogIdpForInitAuthOnly = new CognitoIdentityServiceProvider({
      // Need mock creds ...
      credentials: {
        secretAccessKey: "_",
        accessKeyId: "_"
      },
      region: this.options.awsResources.region
    })

    logging_1.dbg("Logging in", this.options.userCredentials)

    // TODO: won't ever be null if a default is set
    if (this.options.userCredentials == null) {
      return
    }

    const username = this.options.userCredentials.user
    const password = this.options.userCredentials.password

    // TODO: Actually create a `demo` account in the cloud formation ?
    if (username === "demo") {
      return
    }

    const init = await cogIdpForInitAuthOnly
      .initiateAuth({
        ClientId: this.options.awsResources.userPoolClient,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: { USERNAME: username, PASSWORD: password }
      })
      .promise()
    // TODO: report this, store refresh token
    // assume this was to try and tell TypeScript that the object was not null
    // underneath

    if (init.AuthenticationResult == null) {
      return
    }

    const federation =
      "cognito-idp." +
      this.options.awsResources.region +
      ".amazonaws.com/" +
      this.options.awsResources.userPool

    const creds = new CognitoIdentityCredentials({
      Logins: {
        [federation]: init.AuthenticationResult.IdToken
      },
      IdentityPoolId: this.options.awsResources.identityPool
    })
    // TODO: schedule refresh on all of this

    await promisify(creds.refresh.bind(creds))()

    // TODO: schedule refresh on all of this
    const iot = new Iot({
      region: this.options.awsResources.region,
      credentials: creds
    })

    await iot
      .attachPrincipalPolicy({
        policyName: this.options.awsResources.iotOwnThingsPolicy,
        principal: creds.identityId
      })
      .promise()
    // this is an async method, which uses waitCredentials

    // this is an async method, which uses waitCredentials
    this.testCredentials()
    // TODO: what about failing ?

    // this.credentialsSubject.error()
    this.credentialsSubject.next(creds)

    logging_1.dbg("Logged in")
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
