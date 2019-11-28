import { Program } from 'bin/pn';
import { nfcKeys } from './nfcKeys';

interface ConfigJson {
  httpUrl?: string;
  passTypeId?: string;
  collectorId?: number;
}

export class ConfigurationService {
  // location for configuration file
  static defaultHttpUrl = 'http://localhost:3080';

  private _collectorId: number;
  private _passTypeId: string;

  public debug?: boolean;
  public configJson: Promise<ConfigJson | undefined>;
  public http: boolean;
  public mqtt: boolean;
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

    this._passTypeId = passTypeId ? passTypeId : this.nfc.apple.passTypeId;

    if (!this._passTypeId) {
      throw new Error('must supply a passTypeId when running the cli');
    }

    this._collectorId = !collectorId
      ? this.nfc.google.collectorId
      : typeof collectorId === 'number'
      ? collectorId
      : +collectorId;

    if (!this._collectorId) {
      throw new Error('must supply a collectorId when running the cli');
    }

    this.configJson = this.getConfigJson(config);
    this.httpUrl = this.getHttpUrl(program);
  }

  public getCollectorId = async () => {
    const config = await this.configJson;

    if (config && config.collectorId) {
      return +config.collectorId;
    }

    return this._collectorId;
  };

  public getPassTypeId = async () => {
    const config = await this.configJson;

    if (config && config.passTypeId) {
      return config.passTypeId;
    }

    return this._passTypeId;
  };

  private getConfigJson = async (configPath?: string) => {
    if (!configPath) return undefined;

    try {
      // prettier-ignore
      // @ts-ignore
      const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require; // eslint-disable-line @typescript-eslint/camelcase

      const configJson: ConfigJson = requireFunc(configPath);

      console.log(`>>> config file was found at ${configPath}\n>>>`);

      return configJson;
    } catch (err) {
      if (err.message.startsWith('Cannot find module')) {
        console.log(`>>> No config file found at ${configPath}\n>>>`);
        return undefined;
      }

      if (err.message.includes(': Unexpected token')) {
        const location = err.message.split('JSON at position ')[1];
        console.log(
          `>>> Invalid JSON syntax in config.json at position ${location}\n>>>`
        );
        return undefined;
      }

      throw err;
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
