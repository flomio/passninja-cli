import { Observable, Subscription, Subscriber, BehaviorSubject } from 'rxjs';
import * as DeviceSdk from 'aws-iot-device-sdk';
import { generate } from 'shortid';
import { ISubscriptionGrant, Packet } from 'mqtt';

import { ConfigurationService } from './ConfigurationService';
import { AuthService } from './AuthService';

export declare interface ReaderSpec {
  type: string
  serial_number?: string
  firmware?: string
}

export declare interface ScanBase {
  uuid: string
  reader: ReaderSpec
}

export declare interface ApplePayScan extends ScanBase {
  type: 'apple-pay'
  passTypeIdentifier: string
  data: {
    timeStamp: string
    message: string
  }
}

export declare interface SmartTapScan extends ScanBase {
  type: 'smart-tap',
  data: {
    redemptions: [{
      smartTapValue: string
      kind: string
    }]
  }
}

export declare type Scan = ApplePayScan | SmartTapScan

export declare interface MqttMessage {
  topic: string
  message: Scan
}

type MessageHandler = (topic: string, message: Scan) => void
type PacketHandler = (packet: Packet) => void
type ErrorHandler = (err: Error) => void
type EmptyHandler = () => void
type Handler = MessageHandler | PacketHandler | ErrorHandler | EmptyHandler

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
    return this.auth.identityId + this._clientIdSuffix;
  }

  get topic() {
    return  `passScans/`+ (process.env.PASSNINJA_API_BRANCH
    ? process.env.PASSNINJA_API_BRANCH
    : "master") + `/${this.auth.identityId}`
  }
  
  get packetSend$() {
    return this._packetSend$.asObservable();
  }

  get packetReceive$() {
    return this._packetReceive$.asObservable();
  }

  get messages$() {
    return this._messages$.asObservable();
  }

  protected _packetSend$ = new BehaviorSubject<{ packet: Packet }>({ packet: 'INIT' } as any);
  protected _packetReceive$ = new BehaviorSubject<{ packet: Packet }>({ packet: 'INIT' } as any);
  protected _messages$ = new BehaviorSubject<MqttMessage>({ topic: 'INIT', message: 'INIT' } as any);

  private _handlerSubscription$?: Subscription;
  private _client?: DeviceSdk.device;
  private _connected = false;
  private _connectedOnce?: true;
  private _clientIdSuffix = `-dashboard-${generate()}`;

  constructor(private config: ConfigurationService, private auth: AuthService) {
    if (!!instance) {
      return instance;
    }

    instance = this;
    //
    // this.auth.loggedIn$.subscribe(isLoggedIn => {
    //   if (isLoggedIn && !(this.connected || this.connecting)) {
    //     this.connect().catch(err => console.error(err));
    //   }
    // });
  }

  connect = async () => new Promise<void>(async resolve => {
    if (this._client) {
      return;
    }

    this._handlerSubscription$ = this._buildClient$().subscribe(connected => {
      this._connected = connected;
      if (connected) {
        resolve();
      }
    });
  });

  disconnect = () => {
    if (this._client) {
      this._client.end();
    }

    if (this._handlerSubscription$ && !this._handlerSubscription$.closed) {
      this._handlerSubscription$.unsubscribe();
    }

    this._client = this._handlerSubscription$ = this._connectedOnce = undefined;

    this._connected = false;
  };

  subscribe = () =>
    new Promise((resolve, reject) => {
      if (!this._client) {
        return reject(new Error('must be connected to subscribe'));
      }

      this._client.subscribe(
        this.topic, { qos: 1 },
        (err?: Error, granted?: ISubscriptionGrant[]) => {
          if (err) {
            reject(err);
          }
          resolve(granted);
        }
      );
    });

  publish = (message: {}) => new Promise((resolve, reject) => {
    if (!this.connected) {
      throw new Error('must be connected to publish');
    }

    this._client!.publish(this.topic, JSON.stringify(message), { qos: 1 }, (err?: Error) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  cleanUp = () => {
    this.disconnect();
    this._messages$.complete();
    this._packetSend$.complete();
    this._packetReceive$.complete();
  };

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

    this._updateWebSocketCredentials();
  });

  private _attachHandlers = (client: DeviceSdk.device, observer: Subscriber<boolean>) => {
    const listeners: { [name: string]: Handler } = {
      connect: (packet: Packet) => {
        if (this.config.debug) {
          console.log(`connected to mqtt broker: ${JSON.stringify(packet)}`);
        }
        this._connectedOnce = true;
        observer.next(true);
      },
      offline: () => {
        if (this._connectedOnce) {
          console.log('connection to mqtt broker offline');
        }
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
        if (this._connectedOnce) {
          console.error(JSON.stringify(err));
        }
      },
      packetsend: (packet: Packet) => this._packetSend$.next({ packet }),
      packetreceive: (packet: Packet) => this._packetReceive$.next({ packet }),
      message: (topic: string, message: Scan) => this._messages$.next({
        topic,
        message: (message as any).toString() as Scan
      })
    };

    if (this.config.debug) {
      listeners.close = () => console.log('mqtt connection was closed');
    }

    // tslint:disable:forin
    for (const name in listeners) {
      // @ts-ignore - function signature of package is incorrect for connect and message
      client.on(name, listeners[name]);
      observer.add(() => {
        if (client && client.hasOwnProperty('removeListener')) {
          console.log('cleanup ' + name);
          client.removeListener(name, listeners[name]);
        }
      });
    }
  };

  private _updateWebSocketCredentials = () => {
    if (!this._client) {
      return;
    }

    this._client.updateWebSocketCredentials(
      this.auth.accessKeyId,
      this.auth.secretAccessKey,
      this.auth.sessionToken,
      this.auth.expireTime
    );
  };
}

// @Injectable()
// export class AngularMqttService extends MqttService implements OnDestroy {
//   ngOnDestroy = this.cleanUp;
// }
