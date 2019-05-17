import * as DeviceSdk from 'aws-iot-device-sdk';
import { DeviceOptions } from 'aws-iot-device-sdk';
export declare type Connack = any;

export declare interface IotClientInitOptions {
  clientId?: DeviceOptions['clientId'];
  region?: DeviceOptions['region'];
  host?: DeviceOptions['host'];
  protocol?: DeviceOptions['protocol'];
  baseReconnectTimeMs?: DeviceOptions['baseReconnectTimeMs'];
  maximumReconnectTimeMs?: DeviceOptions['maximumReconnectTimeMs'];
  accessKeyId?: DeviceOptions['accessKeyId'];
  secretKey?: DeviceOptions['secretKey'];
  sessionToken?: DeviceOptions['sessionToken'];
  debug?: DeviceOptions['debug'];
  autoResubscribe?: DeviceOptions['autoResubscribe'];
}
/**
 *
 *
 *
 */
let instance: IotClient = null as any;
/**
 *
 * Singleton class to hold mqtt device client instance
 *
 */
export class IotClient {
  client!: DeviceSdk.device;

  constructor(options?: IotClientInitOptions, createNewClient = false) {
    if (createNewClient && !!instance) {
      instance.disconnect();
      instance = null as any;
    }

    if (!!instance) {
      return instance;
    }

    instance = this;

    this.initClient(options);

    if (!!options && !!options.debug) {
      this.attachDebugHandlers();
    }
  }

  private initClient(
    options: IotClientInitOptions = {} as IotClientInitOptions
  ) {
    /**
     * Instantiate AWS IoT device object
     * Note that the credentials must be initialized with empty strings;
     * When we successfully authenticate to the Cognito Identity Pool,
     * the credentials will be dynamically updated.
     */
    console.log(options);
    this.client = new DeviceSdk.device({
      // clientId, region, and host are required options
      clientId: options.clientId || 'very-bad-clientId-for-testing',
      region: options.region || process.env.REGION,
      host:
        options.host ||
        `${process.env.IOT_ENDPOINT}.iot.${process.env.REGION}.amazonaws.com`,
      // AWS access key ID, secret key and session token must be
      // initialized with empty strings
      accessKeyId: options.accessKeyId || '',
      secretKey: options.secretKey || '',
      sessionToken: options.sessionToken || '',
      // Set the maximum reconnect time to 500ms; this is a browser application
      // so we don't want to leave the user waiting too long for re-connection after
      // re-connecting to the network/re-opening their laptop/etc...
      baseReconnectTimeMs: options.baseReconnectTimeMs || 1000,
      maximumReconnectTimeMs: options.maximumReconnectTimeMs || 1000,
      protocol: options.protocol || 'wss',
      debug: typeof options.debug === 'undefined' ? false : options.debug,
      autoResubscribe:
        typeof options.debug === 'undefined' ? false : options.autoResubscribe
    });
  }

  disconnect() {
    this.client.end();
  }

  attachDebugHandlers() {
    /**
     * Attach reconnect, offline, error, message debug handlers
     */
    this.client.on('reconnect', () => {
      console.log('reconnect');
    });

    this.client.on('offline', () => {
      console.log('offline');
    });

    this.client.on('error', err => {
      console.log('iot client error', err);
    });

    this.client.on('message', (topic, message) => {
      console.log('new message', topic, JSON.parse(message.toString()));
    });
  }

  updateWebSocketCredentials(
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken: string
  ) {
    // @ts-ignore - .d.ts is incorrect
    this.client.updateWebSocketCredentials(
      accessKeyId,
      secretAccessKey,
      sessionToken
    );
  }

  attachMessageHandler(onNewMessageHandler: OnMessageHandler) {
    this.client.on('message', onNewMessageHandler);
  }

  attachConnectHandler(onConnectHandler: OnConnectHandler) {
    // @ts-ignore - ts definition is incorrect.
    this.client.on('connect', (connack: Connack) => {
      // log.debug('connected', connack);
      onConnectHandler(connack);
    });
  }

  attachCloseHandler(onCloseHandler: OnCloseHandler) {
    this.client.on('close', (err?: Error) => {
      // log.debug('close', err);
      onCloseHandler(err);
    });
  }

  publish = (topic: string, message: string) => {
    this.client.publish(topic, message);
  };

  subscribe = (topic: string) => {
    this.client.subscribe(topic);
  };

  unsubscribe = (topic: string) => {
    this.client.unsubscribe(topic);
    // log.debug('unsubscribed from topic', topic);
  };
}

export declare type OnMessageHandler = (
  topic: string,
  jsonPayload: JSON
) => void;

export declare type OnConnectHandler = (connack: Connack) => void;

export declare type OnCloseHandler = (err?: Error) => void;
