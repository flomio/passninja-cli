import { Inject, Injectable } from "@angular/core"
import { CONFIG_TOKEN } from "src/app/injection-tokens"
import { EventBus } from "../event-bus"
import { AuthService } from "../auth/auth.service"

@Injectable()
export class ThingsService {
  constructor(
    @Inject(CONFIG_TOKEN) private options: any,
    private events: EventBus,
    private auth: AuthService
  ) {}

  /**
   * TODOD: Make 'recoverable' sequence.
   * Check if thing exists, has one prinicipal attached, that that principal
   * ... yada yada yada
   *
   */
  tryRegisterThing = async (name: string) => {
    const creds = await this.auth.waitCredentials()
    const iot = new AWS.Iot({
      region: this.options.awsResources.region,
      credentials: creds
    })
    const thingName = this.getThingName(creds, name)

    try {
      await iot.describeThing({ thingName }).promise()

      if (!process.env.FORCE_THING_CONF_RECREATE) {
        logging_1.dbg("Already have thing with", name)
        return
      }

      logging_1.dbg(
        "Warning, already have thing with this name," +
          " creating new cert/conf"
      )
    } catch (err) {
      logging_1.dbg("could not describe thing", thingName)
    }

    const thing = await iot
      .createThing({
        thingName
      })
      .promise()

    const certRequest = utils_1.generateCSR(creds.identityId)

    const privateKey = certRequest.key

    const cert = iot
      .createCertificateFromCsr({
        setAsActive: true,
        certificateSigningRequest: certRequest.csr
      })
      .promise()

    const attached = await iot
      .attachPrincipalPolicy({
        principal: cert.certificateArn,
        policyName: this.options.awsResources.iotThingsOwnPolicy
      })
      .promise()

    logging_1.dbg("Cert", cert.certificateArn)
    logging_1.dbg("Attached", attached)

    const thingPrincipal = await iot
      .attachThingPrincipal({
        thingName: thing.thingName,
        principal: cert.certificateArn
      })
      .promise()

    logging_1.dbg("thingPrincipal", thingPrincipal)

    const certificatePem = cert.certificatePem

    await this.writeThingConf(name, {
      key: privateKey,
      // ca: caString,
      user: this.options.userCredentials.user,
      certId: cert.certificateId,
      cert: certificatePem,
      clientId: thingName
    })
  }

  getThingName = (creds, name) => {
    return `${this.options.awsResources.stackName}:${creds.identityId}:${name}`
  }

  getClient = async conf => {
    const region = this.options.awsResources.region
    const accountPrefix = "a17hetn6gw8xzh"
    const brokerUrl =
      "mqtts://" + accountPrefix + "-ats.iot." + region + ".amazonaws.com"
    const ca = `-----BEGIN CERTIFICATE-----
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

    const client = mqtt.connect(brokerUrl, {
      conf,
      ca: [ca]
    })

    client.on("connect", () => {
      logging_1.dbg("MQTT connected!")
    })

    client.on("error", err => {
      logging_1.dbg("MQTT error", err)
    })

    client.on("close", () => {
      logging_1.dbg("MQTT close")
    })

    return client
  }

  loadThingClient = name =>
    this.loadThingConf(name).then(conf => {
      if (conf == null) {
        throw new Error()
      }
      return this.getClient(conf)
    })

  loadLatestThingClient = async () => {
    const folder = this.getConfigDir()
    const files = await promisify(fs.readdir)(folder)
    // TODO: helper function for filtering

    const filePaths = files
      .filter(function(fn) {
        return fn.startsWith("thing-") && fn.endsWith(".json")
      })
      .map(function(fn) {
        return path.join(folder, fn)
      })
      .map(function(fn) {
        return [fn, fs.statSync(fn)]
      })

    const last = _.last(
      _.sortBy(filePaths, [
        // function(_a) {
        //   var fn = _a[0],
        //     stat = _a[1]
        //   return stat.mtimeMs
        // }
      ])
    )

    const fn = last[0]
    const basename = path.basename(fn)

    return this.loadThingClient(
      basename.slice("thing-".length, basename.length - ".json".length)
    )
  }

  loadThingConf = async name => {
    const configDir = this.getConfigDir()
    const thingConfigPath = this.getThingConfigPath(configDir, name)

    if (!fs.existsSync(thingConfigPath)) {
      return null
    }

    const conf = JSON.parse(await util.promisify(fs.readFile)(thingConfigPath))

    return conf
  }

  writeThingConf = async (name, conf) => {
    const configDir = this.getConfigDir()
    const thingConfig = this.getThingConfigPath(configDir, name)
    await util.promisify(fs.writeFile)(thingConfig, JSON.stringify(conf))
    return
  }

  getThingConfigPath = async (configDir, name) =>
    path.join(configDir, "thing-" + name + ".json")

  getConfigDir = async () => {
    const configDir = path.join(os.homedir(), ".pn")

    if (!fs.existsSync(configDir)) {
      await util.promisify(fs.mkdir)(configDir)
    }
    // if (!!fs.existsSync(configDir)) return [3 /*break*/, 2]
    // // TODO: sync ??
    // return [4 /*yield*/, util.promisify(fs.mkdir)(configDir)]

    return configDir
  }
}
