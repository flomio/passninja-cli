import { AuthorizationService } from './AuthorizationService'
import { CleanUpService } from './CleanUp'
import { PassNinjaCliOptions } from './options'

export class ThingService {
  constructor(
    options: PassNinjaCliOptions,
    private _auth: AuthorizationService,
    private _cleanUp: CleanUpService
  ) {
    this._loadConfiguration()
  }

  async registerDevice() {
    if (!this._auth.credentials.AccessKeyId) {
      console.error('you must be logged in to register a device')
    }
  }

  private _loadConfiguration() {}
}
