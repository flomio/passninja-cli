import { Program } from 'bin/pn';
import { nfcKeys } from './nfcKeys';

interface ConfigJson {
  httpUrl?: string;
}

export class ConfigurationService {
  // location for configuration file
  static defaultHttpUrl = 'http://localhost:3080';

  public debug?: boolean;
  public configJson: Promise<ConfigJson | undefined>;
  public http: boolean;
  public mqtt: boolean;
  public collectorId: number;
  public passTypeIdentifier: string;
  public httpUrl: Promise<string>;
  public region = process.env.REGION || 'us-east-1';
  public userPoolClientId =
    process.env.USER_POOL_CLIENT_ID || '7hsccetpkumpavofq81ifji292';
  public userPoolId = process.env.USER_POOL_ID || 'us-east-1_qa9UNxt2o';
  public identityPoolId =
    process.env.IDENTITY_POOL_ID ||
    'us-east-1:8aca505e-e2e8-4583-ac79-ee2fc760c84f';
  public federation =
    process.env.FEDERATION ||
    'cognito-idp.us-east-1.amazonaws.com/us-east-1_qa9UNxt2o';
  public iotHost =
    process.env.IOT_HOST || `a1o5x5ek64x899-ats.iot.us-east-1.amazonaws.com`;
  public nfc = nfcKeys;

  constructor(program: Program) {
    const { debug, config, http, mqtt, collectorId, passTypeId } = program;

    this.debug = debug;
    this.http = !!http;
    this.mqtt = !!mqtt;

    this.passTypeIdentifier = passTypeId
      ? passTypeId
      : this.nfc.apple.passTypeIdentifier;

    if (!this.passTypeIdentifier) {
      throw new Error('must supply a passTypeIdentifier when running the cli');
    }

    this.collectorId = !collectorId
      ? this.nfc.google.collectorId
      : typeof collectorId === 'number'
      ? collectorId
      : parseInt(collectorId);

    if (!this.collectorId) {
      throw new Error('must supply a collectorId when running the cli');
    }

    this.configJson = this.getConfigJson(config);
    this.httpUrl = this.getHttpUrl(program);
  }

  private getConfigJson = async (configPath?: string) => {
    if (!configPath) return undefined;

    try {
      //eslint-disable-next-line @typescript-eslint/no-var-requires
      const configJson: ConfigJson = require(configPath);

      console.log(`>>> config file was found at ${configPath}\n>>>`);

      return configJson;
    } catch (err) {
      if (err.message.startsWith('Cannot find module')) {
        console.log(`>>> No config file found at ${configPath}\n>>>`);
      }
    }
  };

  private getHttpUrl = async (program: Program) => {
    const validateUrl = (url: string) => {
      if (!url.startsWith('http://')) {
        throw new Error('PassNinja Cli only supports POST via http');
      }

      return url;
    };

    const config = await this.configJson;

    if (config && config.httpUrl) {
      this.http = true;
      return validateUrl(config.httpUrl);
    }

    if (typeof program.http === 'string') {
      console.log('>>>\n>>> using command line http url\n>>>');
      return validateUrl(program.http);
    }

    return ConfigurationService.defaultHttpUrl;
  };
}
