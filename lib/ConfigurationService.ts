import { Program } from 'bin/pn';
import { nfcKeys } from './nfcKeys';

const REGION = process.env.REGION || 'us-east-1';

export class ConfigurationService {
  // location for configuration file
  static configJsonLocation = '/home/bioconnect/config.json';
  static defaultHttpUrl = 'http://localhost:3080';

  public debug?: boolean;
  public http: boolean;
  public mqtt: boolean;
  public collectorId: number;
  public passTypeIdentifier: string;
  public httpUrl: Promise<string>;

  get region() {
    return REGION;
  }

  get userPoolClientId() {
    return process.env.USER_POOL_CLIENT_ID || '7hsccetpkumpavofq81ifji292';
  }

  get userPoolId() {
    return process.env.USER_POOL_ID || 'us-east-1_qa9UNxt2o';
  }

  get identityPoolId() {
    return (
      process.env.IDENTITY_POOL_ID ||
      'us-east-1:8aca505e-e2e8-4583-ac79-ee2fc760c84f'
    );
  }

  get federation() {
    return (
      process.env.FEDERATION ||
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_qa9UNxt2o'
    );
  }

  get iotHost() {
    return process.env.IOT_HOST
      ? `a1o5x5ek64x899-ats.iot.${REGION}.amazonaws.com`
      : `${process.env.IOT_HOST}.iot.${REGION}.amazonaws.com`;
  }

  get nfc() {
    return nfcKeys;
  }

  constructor(program: Program) {
    const { debug, http, mqtt, collectorId, passTypeIdentifier } = program;

    this.debug = debug;
    this.http = !!http;
    this.mqtt = !!mqtt;

    this.passTypeIdentifier = passTypeIdentifier
      ? passTypeIdentifier
      : this.nfc.apple.passTypeIdentifier;

    this.collectorId = !collectorId
      ? this.nfc.google.collectorId
      : typeof collectorId === 'number'
        ? collectorId
        : parseInt(collectorId);

    this.httpUrl = this.getHttpUrl(program);

    if (!this.passTypeIdentifier) {
      throw new Error('must supply a passTypeIdentifier when running the cli');
    }

    if (!this.collectorId) {
      throw new Error('must supply a collectorId when running the cli');
    }
  }

  private buildUrl = ({
    url,
    host,
    port,
    path
  }: {
    url?: string,
    host?: string,
    port?: number,
    path?: string
  }) => {
    if (url) {
      return url;
    }

    let httpUrl = `http://${host || 'localhost'}`

    if (port) {
      httpUrl += `:${port}`;
    }

    if (path) {
      httpUrl += path.startsWith('/')
        ? path
        : `/${path}`;
    }

    return httpUrl;
  }

  private getHttpUrl = async (program: Program) => {
    if (program.http) {
      const { httpUrl, httpHost, httpPort, httpPath } = program;

      if (httpUrl || httpHost || httpPort || httpPath) {
        console.log('using command line http configuration');
        return this.buildUrl({
          url: httpUrl,
          host: httpHost,
          port: httpPort,
          path: httpPath
        });
      }

      try {
        const configJson = require(ConfigurationService.configJsonLocation);

        console.log(`config file was found at ${ConfigurationService.configJsonLocation}`);

        const { host, port, path, url } = configJson;

        return this.buildUrl({ url, host, port, path });

      } catch (err) {
        if (err.message.startsWith('Cannot find module')) {
          console.log(`No config file found at ${ConfigurationService.configJsonLocation}`)
        }
      }
    }

    return ConfigurationService.defaultHttpUrl;
  };
}
