import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

import { AuthorizationService } from './AuthorizationService'
import { CleanUpService } from './CleanUp'
import { PassNinjaCliOptions } from './options'

declare interface SerializedConfig {}

export class ThingService {
  get name() {
    // return `${this.options.awsResources.stackName}:${creds.identityId}:${name}`
    return 'PassNinja'
  }

  get configFile() {
    return path.join(os.homedir(), '.pn', `pn-scanner.json`)
  }

  get config(): null | SerializedConfig {
    if (this._config) {
      return this._config
    }

    if (!fs.existsSync(this.configFile)) {
      return null
    }

    this._config = JSON.parse(fs.readFileSync(this.configFile).toString())

    return this._config
  }

  set config(config: SerializedConfig) {
    if (!!this._config) {
      const configDir = path.join(os.homedir(), '.pn')

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir)
      }
    }

    fs.writeFileSync(this.configFile, JSON.stringify(config))

    this._config = config
  }

  private _config: SerializedConfig

  constructor(
    options: PassNinjaCliOptions,
    private _auth: AuthorizationService,
    private _cleanUp: CleanUpService
  ) {
    if (!!this.config) {
      this.registerDevice()
    }
  }

  async registerDevice() {
    if (!this._auth.credentials.AccessKeyId) {
      console.error('you must be logged in to register a device')
    }
  }
}
