// import { connect, MqttClient } from 'mqtt';
// import {
//   fromEvent,
//   throwError,
//   BehaviorSubject,
//   merge,
//   Subscription
// } from 'rxjs';
// import { tap, flatMap } from 'rxjs/operators';

// import { CleanUpService } from './CleanUp';

// import { Config } from '../lib/ConfigurationService';

// declare type MqttStatus = 'online' | 'offline';

// declare interface Connack {
//   sessionPresent: boolean;
// }

// export class MqttService {
//   private _client: MqttClient;
//   private _brokerUrl: string;

//   $status = new BehaviorSubject<MqttStatus>('offline');

//   constructor(private _config: Config, private _cleanUp: CleanUpService) {
//     this._client = connect(
//       this._brokerUrl,
//       { ca: this._config.ca }
//     );

//     const subscription = this.buildListeners().subscribe();

//     this._cleanUp.register(() => {
//       if (!subscription.closed) {
//         subscription.unsubscribe();
//       }

//       this._client.end(true);
//     });
//   }

//   buildListeners() {
//     const $connect = fromEvent<Connack>(this._client, 'connect').pipe(
//       tap(con => {
//         console.log(con);
//         this.$status.next('online');
//         console.log('connected to mqtt broker');
//       })
//     );

//     const $error = fromEvent<Error>(this._client, 'error').pipe(
//       flatMap(err => throwError(new Error(err.message)))
//     );

//     const $offline = fromEvent<void>(this._client, 'offline').pipe(
//       tap(() => {
//         this.$status.next('offline');
//         console.log('connection to mqtt broker offline');
//       })
//     );

//     const $close = fromEvent<void>(this._client, 'close').pipe(
//       tap(() => {
//         console.log('connection to mqtt broker was closed');
//       })
//     );

//     // const $reconnect = fromEvent<void>(this._client, 'reconnect').pipe(
//     //   tap(() => {
//     //     console.log('reconnecting to mqtt broker')
//     //   })
//     // )

//     return merge($connect, $error, $offline, $close);
//   }
// }
