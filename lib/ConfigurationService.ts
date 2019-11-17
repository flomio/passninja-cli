// import * as fs from 'fs';
import * as path from 'path';
import { Program } from 'bin/pn';
import { nfcKeys } from './nfcKeys';

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const REGION = process.env.REGION || 'us-east-1';

export class ConfigurationService {
  // static get directory() {
  //   return path.join('home', 'bioconnect');
  // }

  // static get file() {
  //   return path.join(ConfigurationService.directory, `pn-scanner.json`);
  // }

  // static get saved() {
  //   // block main thread to pull config file first time. Only done on startup to make
  //   // sure config will be defined everywhere
  //   if (!fs.existsSync(ConfigurationService.file)) {
  //     return getBaseConfig();
  //   }

  //   return JSON.parse(fs.readFileSync(ConfigurationService.file).toString());
  // }

  // static set saved(config: SerializedConfig) {
  //   // async save off main thread. state stored in this._config
  //   const write = () => {
  //     fs.writeFile(ConfigurationService.file, JSON.stringify(config), err => {
  //       if (err) throw err;
  //       console.log(`Saved configuration file to ${ConfigurationService.file}`);
  //     });
  //   };

  //   fs.stat(ConfigurationService.directory, (err, stats) => {
  //     if (stats) return write();

  //     if (err && err.code === 'ENOENT') {
  //       return fs.mkdir(ConfigurationService.directory, dirErr => {
  //         if (dirErr) console.error(dirErr);
  //         write();
  //       });
  //     }

  //     throw err;
  //   });
  // }

  public debug?: boolean;
  public collectorId: number;
  public passTypeIdentifier: string;
  public httpUrl?: string;

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
    const { debug, collectorId, passTypeIdentifier } = program;

    this.debug = debug;

    this.passTypeIdentifier = passTypeIdentifier
      ? passTypeIdentifier
      : this.nfc.apple.passTypeIdentifier;

    this.collectorId = !collectorId
      ? this.nfc.google.collectorId
      : typeof collectorId === 'number'
      ? collectorId
      : parseInt(collectorId);

    this.httpUrl = this.getHttpUrl();

    if (!this.passTypeIdentifier) {
      throw new Error('must supply a passTypeIdentifier when running the cli');
    }

    if (!this.collectorId) {
      throw new Error('must supply a collectorId when running the cli');
    }
  }

  private getHttpUrl = () => {
    return 'http://localhost:3080';
  };
}
