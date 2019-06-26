import * as DeviceSdk from 'aws-iot-device-sdk';
import { Observable, Subscription, NEVER, fromEvent, Subscriber } from 'rxjs';
import { generate } from 'shortid';

import { ConfigurationService } from './ConfigurationService';
import { AuthService } from './AuthService';
import { Packet, IConnackPacket } from 'mqtt';

export declare interface MqttMessage {
  topic: string
  message: string
}

const getMqttMessageObservable = (client: DeviceSdk.device) => new Observable<MqttMessage>(observer => {
  const callback = (topic: string, message: Buffer) => {
    observer.next({ topic, message: message.toString() });
  };

  client.on('message', callback);

  observer.add(() => {
    if (client && client.hasOwnProperty('removeListener')) {
      client.removeListener('message', callback);
    }
  });
});

/**
 *
 *
 *
 */
let instance: MqttService = null as any;

/**
 *
 * Singleton class to hold mqtt device client instance
 *
 */
export class MqttService {
  get connected() {
    return this._connected;
  }

  get connecting() {
    return this._client && !this._connected;
  }

  get clientId() {
    return `${this.auth.identityId}-scanner-${this._clientIdSuffix}`;
  }

  get topic() {
    // return 'testing';
    return this.auth.identityId;
  }

  get packetsSent$() {
    return this._client
      ? fromEvent<Packet>(this._client, 'packetsend')
      // TODO: figure out logic for triggering stream to replace with fromEvent after connect
      : NEVER;
  }

  get packetsReceived$() {
    return this._client
      ? fromEvent<Packet>(this._client, 'packetreceive')
      // TODO: figure out logic for triggering stream to replace with fromEvent after connect
      : NEVER;
  }

  get messages$() {
    return this._client
      ? getMqttMessageObservable(this._client)
      // TODO: figure out logic for triggering stream to replace with fromEvent after connect
      : NEVER;
  }

  private _client?: DeviceSdk.device;
  private _client$?: Subscription;
  private _connectedOnce?: boolean;
  private _clientIdSuffix = generate();
  private _connected = false;

  constructor(private config: ConfigurationService, private auth: AuthService, createNewClient = false) {
    if (createNewClient && !!instance) {
      instance.disconnect();
      instance = null as any;
    }

    if (!!instance) {
      return instance;
    }

    instance = this;
  }

  connect = async () => new Promise<void>(async resolve => {
    if (this._client) return;

    if (!this.auth.loggedIn) await this.auth.login();

    this._client$ = this._buildClient$().subscribe(connected => {
      this._connected = connected;
      if (connected) resolve();
    });
  });

  disconnect = () => {
    if (this._client) this._client.end();

    if (this._client$ && !this._client$.closed) this._client$.unsubscribe();

    this._client = this._client$ = this._connectedOnce = undefined;

    this._connected = false
  };

  subscribe = () =>
    new Promise((resolve, reject) => {
      if (!this._client) return reject(new Error('must be connected to subscribe'));

      this._client.subscribe(
        this.topic, { qos: 0 },
        (err, granted) => {
          if (err) {
            reject(err);
          }
          resolve(granted);
        }
      );
    });

  publish = (message: string) => new Promise((resolve, reject) => {
    if (!this.connected) throw new Error('must be connected to publish');
    this._client!.publish(this.topic, message, { qos: 1 }, err => {
      if (err) return reject(err);
      console.log(message);
      resolve();
    });
  });

  private _buildClient$ = () => new Observable<boolean>(observer => {
    /**
     * Instantiate AWS IoT device object
     * Note that the credentials must be initialized with empty strings;
     * When we successfully authenticate to the Cognito Identity Pool,
     * the credentials will be dynamically updated.
     */
    // console.log(this.config);
    this._client = new DeviceSdk.device({
      // clientId, region, and host are required options
      clientId: this.clientId,
      region: this.config.region,
      host: this.config.iotHost,
      // AWS access key ID, secret key and session token must be
      // initialized with empty strings
      accessKeyId: '',
      secretKey: '',
      sessionToken: '',
      // Set the maximum reconnect time to 500ms; this is a browser application
      // so we don't want to leave the user waiting too long for re-connection after
      // re-connecting to the network/re-opening their laptop/etc...
      baseReconnectTimeMs: 1000,
      maximumReconnectTimeMs: 1000,
      protocol: 'wss',
      debug: this.config.debug,
      autoResubscribe: true
    });

    this._attachHandlers(this._client, observer);

    if (Boolean(this.config.debug)) {
      this._attachDebugHandlers(this._client, observer);
    }

    this._updateWebSocketCredentials();
  });

  private _attachHandlers = (client: DeviceSdk.device, observer: Subscriber<boolean>) => {
    const listeners: { [name: string]: (obj: any) => void } = {
      connect: (connack: Packet) => {
        if (this.config.debug) console.log(`connected to mqtt broker: ${JSON.stringify(connack)}`);
        this._connectedOnce = true;
        observer.next(true);
      },
      offline: () => {
        if (this._connectedOnce) console.log('connection to mqtt broker offline');
        observer.next(false);
      },
      reconnect: () => {
        if (this._connectedOnce) {
          console.log('connection to mqtt broker back online');
          observer.next(true);
        }
      },
      error: (err: Error) => {
        // TODO: Matt - Create an MqttError class
        if (this._connectedOnce) console.error(JSON.stringify(err));
      }
    };

    for (const name in listeners) {
      // @ts-ignore - function signature of package is incorrect. connack: Packet is passed
      client.on(name, listeners[name]);
      observer.add(() => {
        if (client && client.hasOwnProperty('removeListener')) {
          client.removeListener(name, listeners[name]);
        }
      });
    }
  };

  private _attachDebugHandlers = (client: DeviceSdk.device, observer: Subscriber<boolean>) => {
    const offlineListener = () => {
      console.log('connection to mqtt broker back online');
    };
    client.on('offline', offlineListener);
    observer.add(() => {
      if (client) client.removeListener('offline', offlineListener);
    });

    const reconnectListener = () => {
      console.log('reconnecting to mqtt broker');
    };
    client.on('reconnect', reconnectListener);
    observer.add(() => {
      if (client) client.removeListener('reconnect', reconnectListener);
    });

    const closeListener = () => {
      console.log('connection to mqtt broker was closed');
    };
    client.on('close', closeListener);
    observer.add(() => {
      if (client) client.removeListener('close', closeListener);
    });
  };

  private _updateWebSocketCredentials = () => {
    if (!this._client) return;

    this._client.updateWebSocketCredentials(
      this.auth.accessKeyId,
      this.auth.secretAccessKey,
      this.auth.sessionToken,
      this.auth.expireTime
    );
  };

}
