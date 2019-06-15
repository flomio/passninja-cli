import * as DeviceSdk from 'aws-iot-device-sdk';
import { generate } from 'shortid';
import { IConnackPacket } from 'mqtt';

import { Configuration } from './Configuration';
import { AuthService } from './AuthService';

/**
 *
 *
 *
 */
let instance: MqttClient = null as any;

/**
 *
 * Singleton class to hold mqtt device client instance
 *
 */
export class MqttClient {
  get connected() {
    return this._connected;
  }

  get connecting() {
    return this._client && !this._connected;
  }

  get clientId() {
    return `${this.auth.identityId}-dashboard-${this._clientIdSuffix}`;
  }

  get topic() {
    return this.auth.identityId;
  }

  private _client?: DeviceSdk.device;
  private _clientIdSuffix = generate();
  private _connected = false;
  private _listeners: string[] = [];

  constructor(private config: Configuration, private auth: AuthService, createNewClient = false) {
    if (createNewClient && !!instance) {
      instance.disconnect();
      instance = null as any;
    }

    if (!!instance) {
      return instance;
    }

    instance = this;

    this._connect()
      .then(connack => console.log(`CONNECTED: ${connack}`))
      .catch(err => console.error(`ERROR setting up MqttClient before CONNACK\n${err}`));
  }

  disconnect = () => {
    if (!this._client) return;

    this._client.end();

    // this should be an observable
    this._listeners.forEach(event => {
      if (this._client) this._client.removeAllListeners(event);
    });
    this._listeners = [];

    this._client = undefined;
  };

  private _connect = () => new Promise<IConnackPacket>(async (resolve, reject) => {
    try {
      if (!this.auth.loggedIn) {
        await this.auth.login();
      }
      this._initClient(resolve);
    } catch (err) {
      reject(err);
    }
  });

  private _initClient = (resolve: (connack: IConnackPacket) => void) => {
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

    if (Boolean(this.config.debug)) {
      this._attachDebugHandlers();
    }

    this._listeners.push('error');
    // @ts-ignore - function signature of package is incorrect
    this._client.on('error', (err: Error) => {
      console.error(JSON.stringify(err));
      // TODO: Matt - Create an MqttError class
    });

    this._listeners.push('connect');
    // @ts-ignore - function signature of package is incorrect. connack: Packet is passed
    this._client.on('connect', (connack: Packet) => {
      console.log(`connected to mqtt broker: ${JSON.stringify(connack)}`);
      this._connected = true;
      resolve(connack);
    });

    this._updateWebSocketCredentials();
  };

  private _updateWebSocketCredentials = () => {
    if (!this._client) return;

    console.log('updating');
    this._client.updateWebSocketCredentials(
      this.auth.accessKeyId,
      this.auth.secretAccessKey,
      this.auth.sessionToken,
      this.auth.expireTime
    );
  };

  private _attachDebugHandlers = () => {
    if (!this._client) return;

    // @ts-ignore - .d.ts says this event doesnt exist but it does, just sayin
    this._client.on('packetsend', (packet: Packet) => {
      console.log(`packet sent ${JSON.stringify(packet)}`);
    });
    this._listeners.push('packetsend');

    // @ts-ignore - .d.ts says this event doesnt exist but it does
    this._client.on('packetreceive', (packet: Packet) => {
      console.debug(`packet received ${JSON.stringify(packet)}`);
    });
    this._listeners.push('packetreceive');

    // @ts-ignore - definition does not allow for two objects in event
    this._client.on('message', (topic: string, message: any) => {
      console.log(
        `>>>\nmessage received on topic ${topic}\n
         >>>\n${message.toString()}\n>>>\n`
      );
    });
    this._listeners.push('message');

    this._client.on('offline', () => {
      this._connected = false;
      console.log('connection to mqtt broker offline');
    });
    this._listeners.push('offline');

    this._client.on('reconnect', () => {
      this._connected = false;
      console.log('reconnecting to mqtt broker');
    });
    this._listeners.push('reconnect');

    this._client.on('close', () => {
      this._connected = false;
      console.log('connection to mqtt broker was closed');
    });
    this._listeners.push('close');
  };
}

// ngOnDestroy = () => {
//   this.disconnect()
//   this._$subscription.unsubscribe()
// }

// publish = (message: string) => {
//   this._client.publish(this.topic, message)
// }

//   private subscribe = () =>
//     new Promise((resolve, reject) => {
//       this._client.subscribe(
//         this.topic,
//         {
//           qos: 0
//         },
//         (err, granted) => {
//           if (err) {
//             reject(err);
//           }
//
//           this._$messages.next({
//             topic: this.topic,
//             message: {
//               message: 'subscribed to topic',
//               granted: JSON.stringify(granted)
//             }
//           });
//
//           resolve(granted);
//         }
//       );
//     });
// }

// private buildListeners = () => {
//   const $connect = fromEvent<Packet>(this._client, 'connect').pipe(
//     tap(con => {
//       this._connected = true
//       console.log(`connected to mqtt broker: ${con}`)
//     })
//   )
//
//   const $packetSend = fromEvent<Packet>(this._client, 'packetsend').pipe(
//     tap(packet => {
//       console.debug(`packet sent ${JSON.stringify(packet)}`)
//       this.packetUp$.emit(packet)
//     })
//   )
//
//   const $packetReceive = fromEvent<Packet>(
//     this._client,
//     'packetreceive'
//   ).pipe(
//     tap(packet => {
//       console.debug(`packet received ${JSON.stringify(packet)}`)
//       this.packetDown$.emit(packet)
//     })
//   )
//
//   const $message = fromEvent<any>(this._client, 'message').pipe(
//     // @ts-ignore - definition does not allow for two objects in event
//     tap((topic: string, message: any) => {
//       const parsed = JSON.parse(message.toString())
//
//       console.log(
//         `>>>\n
//               message received on topic ${topic}\n
//               >>>\n${parsed}\n>>>\n`
//       )
//
//       this._$messages.next({ topic, message: parsed })
//     })
//   )
//
//   const $offline = fromEvent<void>(this._client, 'offline').pipe(
//     tap(() => {
//       this._connected = false
//       console.log('connection to mqtt broker offline')
//     })
//   )
//
//   const $reconnect = fromEvent<void>(this._client, 'reconnect').pipe(
//     tap(() => {
//       console.log('reconnecting to mqtt broker')
//     })
//   )
//
//   const $close = fromEvent<void>(this._client, 'close').pipe(
//     tap(() => {
//       this._connected = false
//       console.log('connection to mqtt broker was closed')
//     })
//   )
//
//   const $error = fromEvent<Error>(this._client, 'error').pipe(
//     // TODO: Matt - Create an MqttError class
//     tap(err => {
//       console.error(JSON.stringify(err))
//       // throwError(new Error(err.message))
//     })
//   )
//
//   return merge(
//     $connect,
//     $packetSend,
//     $packetReceive,
//     $message,
//     $error,
//     $offline,
//     $close,
//     $reconnect
//   )
// }

// private unsubscribe = () => {
//   this._client.unsubscribe(this.topic)
//   console.debug('unsubscribed from topic', this.topic)
// }

// export declare type OnMessageHandler = (
//   topic: string,
//   jsonPayload: JSON
// ) => void

// export declare type OnConnectHandler = (connack: Connack) => void

// export declare type OnCloseHandler = (err?: Error) => void
