import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

declare interface NfcKey {
  privateKeyPem: string;
}

const isNfcKey = (key: any): key is NfcKey => {
  return typeof key === 'object'
    && key.hasOwnProperty('privateKeyPem')
    && typeof (key as NfcKey).privateKeyPem === 'string'
    && !!(key as NfcKey).privateKeyPem.length;
};

declare interface AppleVasKey extends NfcKey {
  passTypeIdentifier: string
}

const isAppleVasKey = (key: any): key is AppleVasKey => {
  return isNfcKey(key)
    && key.hasOwnProperty('passTypeIdentifier')
    && typeof (key as AppleVasKey).passTypeIdentifier === 'string'
    && !!(key as AppleVasKey).passTypeIdentifier.length;
};

declare interface GoogleSmartTapKey extends NfcKey {
  collectorId: number
  version: number
}

const isGoogleSmartTapKey = (key: any): key is GoogleSmartTapKey => {
  return isNfcKey(key)
    && typeof (key as GoogleSmartTapKey).collectorId === 'number'
    && typeof (key as GoogleSmartTapKey).version === 'number';
};

declare interface NfcKeys {
  appleVAS: {
    keys: AppleVasKey[]
  },
  googleSmartTap: {
    keys: GoogleSmartTapKey[]
  }
}

const isNfcKeys = (keys: any): keys is NfcKeys => {

  const isValidKeyArray = (keyName: 'googleSmartTap' | 'appleVAS') => keys.hasOwnProperty(keyName)
    && keys[keyName].hasOwnProperty('keys')
    && Array.isArray(keys[keyName].keys)
    && !keys[keyName].keys.filter((key: any) =>
      keyName === 'googleSmartTap'
        ? !isGoogleSmartTapKey(key)
        : !isAppleVasKey(key)
    ).length;

  return typeof keys === 'object'
    && isValidKeyArray('appleVAS')
    && isValidKeyArray('googleSmartTap');
};

export const getNfc = (pathToKeys: string) => {
  // pass in key string for future support for lambda based get on registration
  if (fs.existsSync(pathToKeys)) {
    const keys = JSON.parse(fs.readFileSync(pathToKeys).toString()) as NfcKeys;
    return {
      selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
      selectCollectorId: 77501435,
      keys
    };
  }
  throw new Error('No NFC keys were found');
};

export const isNfc = (nfc: any) => {
  return isNfcKeys(nfc.keys);
};

export const getBaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const region = process.env.REGION || '';
  const pathToKeys = path.resolve(__dirname, 'pn-nfc-keys.json');

  return {
    region,
    stack: `pass-ninja-${env}`,
    userPoolId: process.env.USER_POOL_ID || '',
    userPoolClientId: process.env.USER_POOL_CLIENT_ID || '',
    identityPoolId: process.env.IDENTITY_POOL_ID || '',
    federation: process.env.FEDERATION || '',
    iotHost: `${process.env.IOT_HOST}.iot.${region}.amazonaws.com`,
    nfc: getNfc(pathToKeys)
  };
};

export declare type SerializedConfig = ReturnType<typeof getBaseConfig> & {
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
