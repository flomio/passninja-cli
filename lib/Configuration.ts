import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

export declare interface NfcKeys {

}

export const getNFCKeys = (): NfcKeys => {
  const pathToKeys = path.resolve(__dirname, '..', 'pn-nfc-keys.json');

  if (fs.existsSync(pathToKeys)) {
    return JSON.parse(fs.readFileSync(pathToKeys).toString());
  }

  throw new Error('No NFC keys were found');
};

export const getBaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const region = process.env.REGION || '';

  return {
    region,
    stack: `pass-ninja-${env}`,
    userPoolId: process.env.USER_POOL_ID || '',
    userPoolClientId: process.env.USER_POOL_CLIENT_ID || '',
    identityPoolId: process.env.IDENTITY_POOL_ID || '',
    federation: process.env.FEDERATION || '',
    iotHost: `${process.env.IOT_HOST}.iot.${region}.amazonaws.com`,
    nfc: {
      selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
      selectCollectorId: 77501435,
      keys: getNFCKeys()
    }
  };
};

export declare type SerializedConfig = ReturnType<typeof getBaseConfig> & {
  [key: string]: string | ReturnType<typeof getBaseConfig>['nfc'];
};

export interface PassNinjaConfigurationOptions {
  username?: string;
  password?: string;
}

export class Configuration {
  static get directory() {
    return path.join(os.homedir(), '.passninja');
  }

  static get file() {
    return path.join(Configuration.directory, `pn-scanner.json`);
  }

  static get saved() {
    // block main thread to pull config file first time. Only done on startup to make
    // sure config will be defined everywhere
    if (!fs.existsSync(Configuration.file)) {
      return getBaseConfig();
    }

    return JSON.parse(fs.readFileSync(Configuration.file).toString());
  }

  static set saved(config: SerializedConfig) {
    // async save off main thread. state stored in this._config
    const write = () => {
      fs.writeFile(Configuration.file, JSON.stringify(config), err => {
        if (err) throw err;
        console.log(`Saved configuration file to ${Configuration.file}`);
      });
    };

    fs.stat(Configuration.directory, (err, stats) => {
      if (stats) return write();

      if (err && err.code === 'ENOENT') {
        return fs.mkdir(Configuration.directory, dirErr => {
          if (dirErr) console.error(dirErr);
          write();
        });
      }

      throw err;
    });
  }

  private _config: SerializedConfig = getBaseConfig();

  get stack() {
    return this._config.stack;
  }

  get region() {
    return this._config.region;
  }

  get userPoolClientId() {
    return this._config.userPoolClientId;
  }

  get userPoolId() {
    return this._config.userPoolId;
  }

  get identityPoolId() {
    return this._config.identityPoolId;
  }

  get federation() {
    return this._config.federation;
  }

  get iotHost() {
    return this._config.iotHost;
  }

  get nfc() {
    return this._config.nfc;
  }

  constructor(public readonly debug = false) {
    for (const key in this._config) {
      const value = this._config[key];

      if (!(value && `${value}`.length)) {
        throw new Error(`config.${key} must be defined in .env at build time`);
      }
    }
  }
}
