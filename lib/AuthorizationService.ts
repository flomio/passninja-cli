import {
  CognitoIdentityServiceProvider,
  CognitoIdentity,
  CognitoIdentityCredentials
} from 'aws-sdk'
import { BehaviorSubject } from 'rxjs'

import { PassNinjaCliOptions } from './options'
import { CleanUpService } from './CleanUp'

export class AuthorizationService {
  get credentials() {
    return this._$credentials.getValue()
  }

  get $credentials() {
    return this._$credentials.asObservable()
  }

  private _provider = new CognitoIdentityServiceProvider({
    region: this.options.resources.region
  })

  private _credentials: CognitoIdentityCredentials

  private _$credentials = new BehaviorSubject<CognitoIdentity.Credentials>(
    {} as any
  )

  constructor(
    private options: PassNinjaCliOptions,
    private _cleanUp: CleanUpService
  ) {
    this.setup().then(() => console.log('logged in'))

    this._cleanUp.register(() => {
      this._$credentials.complete()
    })
  }

  update = async () => {
    await this._credentials.refreshPromise()
    this._$credentials.next(this._credentials.data.Credentials)
    return this.credentials
  }

  private setup = async () => {
    const response = await this._provider
      .initiateAuth({
        ClientId: this.options.resources.userPoolClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: this.options.username,
          PASSWORD: this.options.password
        }
      })
      .promise()

    if (!response.AuthenticationResult) {
      throw new Error(
        'could not login to authentication provider. check username and password'
      )
    }

    this._credentials = new CognitoIdentityCredentials({
      IdentityPoolId: this.options.resources.identityPoolId,
      Logins: {
        [this.options.resources.federation]:
          response.AuthenticationResult.IdToken
      }
    })

    // not sure why this was in the original code or if it was dewebpacked correctly
    // await this.credentials.refreshPromise()

    this._$credentials.next(this._credentials.data.Credentials)
  }
}
