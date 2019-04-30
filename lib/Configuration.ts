import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const getBaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const stack = `passninja-${env}`;
  const region = process.env.REGION || 'us-east-1';
  const userPoolClientId = `${process.env.USER_POOL_CLIENT_ID}`;
  const identityPoolId = `${process.env.IDENTITY_POOL_ID}`;
  const userPoolId = `${process.env.USER_POOL_ID}`;
  const federation = 'cognito-idp.' + region + '.amazonaws.com/' + userPoolId;
  const iotEndpoint = `${process.env.IOT_ENDPOINT}`;
  const brokerUrl = `wss://${iotEndpoint}.iot.${region}.amazonaws.com/mqtt`;

  const BASE_CONFIG = {
    stack,
    region,
    userPoolClientId,
    userPoolId,
    identityPoolId,
    federation,
    iotEndpoint,
    brokerUrl,
    ca: `-----BEGIN CERTIFICATE-----
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
  };

  for (let key in BASE_CONFIG) {
    if (!(BASE_CONFIG as any)[key].length) {
      throw new Error(`config.${key} must be defined in .env at build time`);
    }
  }

  return BASE_CONFIG;
};

declare type SerializedConfig = ReturnType<typeof getBaseConfig> & {
  username?: string;
  password?: string;
};

export class Configuration {
  static get directory() {
    return path.join(os.homedir(), '.passninja');
  }

  static get file() {
    return path.join(Configuration.directory, `pn-scanner.json`);
  }

  static get saved(): SerializedConfig {
    // block main thread to pull config file first time. only done on startup to make
    // sure config will be defined elsewhere
    if (!fs.existsSync(Configuration.file)) {
      return getBaseConfig();
    }

    return JSON.parse(fs.readFileSync(Configuration.file).toString());
  }

  static set saved(config: SerializedConfig) {
    // async save off main thread. state stored in this._config
    const write = () => {
      fs.writeFile(Configuration.file, JSON.stringify(config), writeErr => {
        console.error(writeErr);
        throw writeErr;
      });
    };

    fs.stat(Configuration.directory, (err, stats) => {
      if (err) {
        throw err;
      }

      stats.isDirectory()
        ? write()
        : fs.mkdir(Configuration.directory, dirErr => {
            if (dirErr) console.error(dirErr);
            write();
          });

      // if (stats.isDirectory()) {
      // if no stats means directory doesn't exist.
      // so make it and write file
      //   fs.mkdir(Configuration.directory, dirErr => {
      //     if (dirErr) {
      //       console.error(dirErr);
      //       throw dirErr;
      //     }
      //     write();
      //   });
      // } else {
      //   // use else to prevent async write before end of async creating
      //   // directory if doesn't exist
      // write();
      // }
    });
  }

  static getUsername() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'demo@user.com';
  }

  static getPassword() {
    /**
     *
     * add inquirer module to prompt user
     *
     */
    return 'Pass!@#$334--';
  }

  private _config = Configuration.saved;

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

  get iotEndpoint() {
    return this._config.iotEndpoint;
  }

  get brokerUrl() {
    return this._config.brokerUrl;
  }

  get ca() {
    return this._config.ca;
  }

  get username() {
    return this._config.username;
  }

  get password() {
    return this._config.password;
  }

  constructor({
    username = Configuration.getUsername(),
    password = Configuration.getPassword()
  }) {
    if (this._config.username !== username) {
      this._config.username = username;
    }

    if (this._config.password !== password) {
      this._config.password = password;
    }

    Configuration.saved = this._config;
  }
}

// get name() {
//   // return `${this.options.awsResources.stackName}:${creds.identityId}:${name}`
//   return 'PassNinja'
// }
