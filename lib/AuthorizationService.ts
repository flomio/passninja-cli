import {
  CognitoIdentityServiceProvider,
  CognitoIdentityCredentials,
  Credentials
} from 'aws-sdk'
import { BehaviorSubject } from 'rxjs'

import { Config } from '../lib/config'

import { cleanUpService } from './CleanUp'

export class AuthorizationService {
  get credentials() {
    return this._$credentials.getValue()
  }

  get $credentials() {
    return this._$credentials.asObservable()
  }

  private _cleanUp = cleanUpService

  private _provider = new CognitoIdentityServiceProvider({
    region: this._config.region
  })

  private _credentials: CognitoIdentityCredentials

  private _$credentials = new BehaviorSubject<Credentials>({} as any)

  constructor(private _config: Config) {
    this.setup().then(() => console.log('logged in'))

    this._cleanUp.register(() => {
      this._$credentials.complete()
    })
  }

  update = async () => {
    await this._credentials.refreshPromise()
    this._$credentials.next(this._credentials)
    return this.credentials
  }

  private setup = async () => {
    try {
      const response = await this._provider
        .initiateAuth({
          ClientId: this._config.userPoolClientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: this._config.username,
            PASSWORD: this._config.password
          }
        })
        .promise()

      // if (!response.AuthenticationResult) {
      //   throw new Error(
      //     'could not login to authentication provider. check username and password'
      //   )
      // }

      // this._credentials = new CognitoIdentityCredentials({
      //   IdentityPoolId: this._config.identityPoolId,
      //   Logins: {
      //     [this._config.federation]: response.AuthenticationResult.IdToken
      //   }
      // })
    } catch (err) {
      console.error(err)
    }
    // not sure why this was in the original code or if it was dewebpacked correctly
    // await this.credentials.refreshPromise()

    this._$credentials.next(this._credentials)
  }
}
