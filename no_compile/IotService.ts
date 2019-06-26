import { device } from 'aws-iot-device-sdk';

import {
  fromEvent,
  throwError,
  BehaviorSubject,
  merge,
  Subscription
} from 'rxjs';
import { tap, flatMap } from 'rxjs/operators';

import { CleanUpService } from './CleanUpService';

import { Configuration } from './Configuration';
import {
  AuthorizationService,
  PassNinjaCredentials
} from './AuthorizationService';
import { Iot, CognitoIdentityCredentials } from 'aws-sdk';

// declare type MqttStatus = 'online' | 'offline';

// declare interface Connack {
//   sessionPresent: boolean;
// }

export declare interface MqttServiceOptions {
  config: Configuration;
  auth: AuthorizationService;
}

export class IotService {
  get thingName() {
    return `${
      (this.creds as CognitoIdentityCredentials).identityId
    }:passninja-cli:machine-id-from-scanner`;
  }

  private listeners$?: Subscription;
  private subscription: Subscription;
  private creds!: PassNinjaCredentials;
  private iot?: Iot;
  private device!: device;

  // $status = new BehaviorSubject<MqttStatus>('offline');

  constructor(
    private config: Configuration,
    private auth: AuthorizationService,
    private cleanUp: CleanUpService
  ) {
    this.subscription = this.auth.$credentials.subscribe(creds =>
      this.updateCreds(creds)
    );

    this.cleanUp.register(() => {
      if (!this.subscription.closed) {
        this.subscription.unsubscribe();
      }

      if (this.device) {
        this.device.end(true);
      }

      console.log('cleaned up IoTService');
    });
  }

  private connect = () => {
    const { accessKeyId, secretAccessKey, sessionToken } = this
      .creds as CognitoIdentityCredentials;

    try {
      this.iot = new Iot({
        region: this.config.region,
        credentials: this.creds as CognitoIdentityCredentials
      });

      if (!!this.listeners$) {
        this.listeners$.unsubscribe();
      }

      this.device = new device({
        host: this.config.brokerUrl,
        debug: true,
        clientId: this.thingName,
        protocol: 'wss',
        accessKeyId,
        secretKey: secretAccessKey,
        sessionToken
      });

      this.listeners$ = this.buildListeners().subscribe();

      this.subscription.add(this.listeners$);
    } catch (err) {
      console.error(`>>> ERROR >>> ${err}`);
    }
  };

  private updateCreds = (creds: PassNinjaCredentials) => {
    this.creds = creds;

    if (this.creds instanceof CognitoIdentityCredentials) {
      this.connect();
    }
  };


  private buildListeners = () => {
    const $connect = fromEvent<any>(this.device, 'connect').pipe(
      tap(con => {
        console.log(con);
        // this.$status.next('online');
        console.log('connected to mqtt broker');
      })
    );

    const $error = fromEvent<Error>(this.device, 'error').pipe(
      flatMap(err => {
        console.log(err);
        return throwError(new Error(err.message));
      })
    );

    const $close = fromEvent<void>(this.device, 'close').pipe(
      tap(() => {
        console.log('connection to mqtt broker was closed');
      })
    );

    const $offline = fromEvent<void>(this.device, 'offline').pipe(
      tap(() => {
        // this.$status.next('offline');
        console.log('connection to mqtt broker offline');
      })
    );


    const $reconnect = fromEvent<void>(this.device, 'reconnect').pipe(
      tap(() => {
        console.log('reconnecting to mqtt broker');
      })
    );

    return merge($connect, $error, $close, $offline, $reconnect);
  };

  // private createThing = async () => {
  //   try {
  //     await this.iot
  //       .createThing({
  //         thingName: this.thingName
  //       })
  //       .promise();

  //     await this.iot
  //       .attachPrincipalPolicy({
  //         principal: this.credentials.identityId,
  //         policyName: 'pass-ninja-iot-policy'
  //       })
  //       .promise();

  //     await this.iot
  //       .attachThingPrincipal({
  //         thingName: this.thingName,
  //         principal: this.credentials.identityId
  //       })
  //       .promise();

  //     console.log(
  //       `iot policy for device ${this.thingName} attached to identity ${
  //         this.credentials.identityId
  //       }`
  //     );
  //   } catch (err) {
  //     console.error(`>>> setupIot ERROR >>> ${err}`);
  //   }
  // };
}
