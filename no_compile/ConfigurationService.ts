import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { Iot } from 'aws-sdk'

// import { AuthorizationService } from '../no_compile/AuthorizationService'
// import { Config } from './config'
// import { generateCSR } from 'src/app/services/iot/utils'

import { cleanUpService } from '../lib/CleanUp'

export class ConfigurationService {
  get name() {
    // return `${this.options.awsResources.stackName}:${creds.identityId}:${name}`
    return 'PassNinja'
  }

  get configFile() {
    return path.join(os.homedir(), '.pn', `pn-scanner.json`)
  }

  get config(): Config {
    if (this._config) {
      return this._config
    }

    if (!fs.existsSync(this.configFile)) {
      return null
    }

    this._config = JSON.parse(fs.readFileSync(this.configFile).toString())

    return this._config
  }

  set config(config: Config) {
    if (!!this._config) {
      const configDir = path.join(os.homedir(), '.pn')

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir)
      }
    }

    fs.writeFileSync(this.configFile, JSON.stringify(config))

    this._config = config
  }

  private _config: Config

  constructor(
    private options: CliOptions,
    private _auth: AuthorizationService
  ) {
    if (!!this.config) {
      this.registerDevice()
    }
  }

  async registerDevice() {
    if (!this._auth.credentials.accessKeyId) {
      console.error('you must be logged in to register a device')
    }

    const iot = new Iot({
      region: this._options.resources.region,
      credentials: this._auth.credentials
    })

    try {
      await iot.describeThing({ thingName: this.name }).promise()
      // if (!process.env.FORCE_THING_CONF_RECREATE) {
      //   console.log('Already have thing with', name)
      //   return
      // }
      console.log(
        'Warning, already have thing with this name,' +
          ' creating new cert/conf'
      )
    } catch (err) {
      console.log('could not describe thing', this.name)
    }

    const thing = await iot
      .createThing({
        thingName: this.name
      })
      .promise()

    // TODO: double check what type of ID should be used as a parameter
    const certRequest = generateCSR(this._auth.credentials.accessKeyId)

    const privateKey = certRequest.key

    const cert = await iot
      .createCertificateFromCsr({
        setAsActive: true,
        certificateSigningRequest: certRequest.csr
      })
      .promise()

    const attached = await iot
      .attachPrincipalPolicy({
        principal: cert.certificateArn,
        policyName: this._options.resources.iotThingsOwnPolicy
      })
      .promise()

    console.log('Cert', cert.certificateArn)

    console.log('Attached', attached)

    const thingPrincipal = await iot
      .attachThingPrincipal({
        thingName: thing.thingName,
        principal: cert.certificateArn
      })
      .promise()

    console.log('thingPrincipal', thingPrincipal)

    const certificatePem = cert.certificatePem

    // await this.writeThingConf(name, {
    //   key: privateKey,
    //   // ca: caString,
    //   user: this.options.userCredentials.user,
    //   certId: cert.certificateId,
    //   cert: certificatePem,
    //   clientId: thingName
    // })
  }
}
