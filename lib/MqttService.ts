import { connect, MqttClient } from 'mqtt'
import {
  fromEvent,
  throwError,
  BehaviorSubject,
  merge,
  Subscription
} from 'rxjs'
import { tap, flatMap } from 'rxjs/operators'
import { PassNinjaCliOptions } from './options'
import { CleanUpService } from './CleanUp'

declare type MqttStatus = 'online' | 'offline'

declare interface Connack {
  sessionPresent: boolean
}

export class MqttService {
  private _ca = `-----BEGIN CERTIFICATE-----
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

  private _brokerUrl = `wss://${this._options.resources.iotEndpoint}
    .iot.${this._options.resources.region}.amazonaws.com/mqtt`

  private _client: MqttClient

  $status = new BehaviorSubject<MqttStatus>('offline')

  constructor(
    private _options: PassNinjaCliOptions,
    private _cleanUp: CleanUpService
  ) {
    this._client = connect(
      this._brokerUrl,
      { ca: this._ca }
    )

    const subscription = this.buildListeners().subscribe()

    this._cleanUp.register(() => {
      if (!subscription.closed) {
        subscription.unsubscribe()
      }

      this._client.end(true)
    })
  }

  buildListeners() {
    const $connect = fromEvent<Connack>(this._client, 'connect').pipe(
      tap(con => {
        console.log(con)
        this.$status.next('online')
        console.log('connected to mqtt broker')
      })
    )

    const $error = fromEvent<Error>(this._client, 'error').pipe(
      flatMap(err => throwError(new Error(err.message)))
    )

    const $offline = fromEvent<void>(this._client, 'offline').pipe(
      tap(() => {
        this.$status.next('offline')
        console.log('connection to mqtt broker offline')
      })
    )

    const $close = fromEvent<void>(this._client, 'close').pipe(
      tap(() => {
        console.log('connection to mqtt broker was closed')
      })
    )

    // const $reconnect = fromEvent<void>(this._client, 'reconnect').pipe(
    //   tap(() => {
    //     console.log('reconnecting to mqtt broker')
    //   })
    // )

    return merge($connect, $error, $offline, $close)
  }
}
