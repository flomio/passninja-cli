import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { Iot } from 'aws-sdk'

import { AuthorizationService } from './AuthorizationService'
import { CleanUpService } from './CleanUp'
import { PassNinjaCliOptions } from './options'
import { generateCSR } from 'src/app/services/iot/utils'

declare interface SerializedConfig {}

export class ConfigurationService {
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

  private _brokerUrl = `wss://${this._options.resources.iotEndpoint}
    .iot.${this._options.resources.region}.amazonaws.com/mqtt`

  private _ca = `-----BEGIN CERTIFICATE-----
  MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
  ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
  b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
  MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
  b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
  ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
  9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
  IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
  VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
  93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
  jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
  AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
  A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
  U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
  N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
  o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
  5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
  rqXRfboQnoZsG4q5WTP468SQvvG5
  -----END CERTIFICATE-----`

  constructor(
    private _options: PassNinjaCliOptions,
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
      //   logging_1.dbg('Already have thing with', name)
      //   return
      // }
      logging_1.dbg(
        'Warning, already have thing with this name,' +
          ' creating new cert/conf'
      )
    } catch (err) {
      logging_1.dbg('could not describe thing', this.name)
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

    logging_1.dbg('Cert', cert.certificateArn)

    logging_1.dbg('Attached', attached)

    const thingPrincipal = await iot
      .attachThingPrincipal({
        thingName: thing.thingName,
        principal: cert.certificateArn
      })
      .promise()

    logging_1.dbg('thingPrincipal', thingPrincipal)

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
