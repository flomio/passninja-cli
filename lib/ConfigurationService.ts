import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { getBaseConfig } from './utils/getBaseConfig';
import { isNfc } from './utils';

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

export type SerializedConfig = ReturnType<typeof getBaseConfig> & {
  [key: string]: string | ReturnType<typeof getBaseConfig>['nfc'];
};

export interface PassNinjaConfigurationOptions {
  username?: string;
  password?: string;
}

export class ConfigurationService {
  static get directory() {
    return path.join(os.homedir(), '.passninja');
  }

  static get file() {
    return path.join(ConfigurationService.directory, `pn-scanner.json`);
  }

  static get saved() {
    // block main thread to pull config file first time. Only done on startup to make
    // sure config will be defined everywhere
    if (!fs.existsSync(ConfigurationService.file)) {
      return getBaseConfig();
    }

    return JSON.parse(fs.readFileSync(ConfigurationService.file).toString());
  }

  static set saved(config: SerializedConfig) {
    // async save off main thread. state stored in this._config
    const write = () => {
      fs.writeFile(ConfigurationService.file, JSON.stringify(config), err => {
        if (err) throw err;
        console.log(`Saved configuration file to ${ConfigurationService.file}`);
      });
    };

    fs.stat(ConfigurationService.directory, (err, stats) => {
      if (stats) return write();

      if (err && err.code === 'ENOENT') {
        return fs.mkdir(ConfigurationService.directory, dirErr => {
          if (dirErr) console.error(dirErr);
          write();
        });
      }

      throw err;
    });
  }

  private _config: SerializedConfig = getBaseConfig();

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

      if (typeof value === 'string' && !value.length) {
        throw new Error(`config.${key} must be defined in .env at build time`);
      }

      if (key === 'nfc' && !isNfc(value)) {
        throw new Error(`malformed nfc keys at build time`);
      }
    }
  }
}
