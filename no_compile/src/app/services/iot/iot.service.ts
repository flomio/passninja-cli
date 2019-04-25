import { Inject, Injectable } from '@angular/core'
import { machineId } from './utils'
import { CONFIG_TOKEN } from '../../injection-tokens'
import { AuthService } from '../auth/auth.service'
import { EventBus } from '../event-bus'
import { dbg } from '../../logging'
import { smartTapData, vasData } from '../../events'
import { ThingsService } from './things.service'

@Injectable()
export class IotService {
  private init = false

  private mqtt: null | any = null

  constructor(
    @Inject(CONFIG_TOKEN) private options: any,
    private thingService: ThingsService,
    private events: EventBus,
    private auth: AuthService
  ) {
    const scanEvents = [smartTapData, vasData]

    scanEvents.forEach(event => {
      this.events.on(event, data => {
        // {
        //   uuid: v4(),
        //   // TODO: should use smartTap likely
        //   type: "smart-tap",
        //   reader: readerWithSpec.spec,
        //   data: resp.args.data,
        //   collectorId: selectOSEMsg.args.collectorId
        // }
        //
        // - OR -
        // {
        //   type: "apple-pay",
        //   uuid: v4(),
        //   data: resp.args.data,
        //   reader: readerWithSpec.spec,
        //   passTypeIdentifier: selectPassTypeIdentifier
        // }

        // dbg(event, JSON.stringify(data, null, 2));
        if (this.mqtt == null) {
          return
        } else {
          this.mqtt.then(client => {
            const cognitoId = client.options.clientId
              .split(':')
              .slice(1, 3)
              .join(':')
            const topic =
              options.awsResources.stackName +
              '/' +
              cognitoId +
              '/' +
              client.options.clientId +
              '/scan'
            client.publish(topic, JSON.stringify(data))
          })
        }
      })
    })
  }

  lazyInit() {
    if (!this.init) {
      this.mqtt = this.setupClient()
      this.init = true
    }
  }

  async setupClient() {
    if (this.auth.noCredentials()) {
      return this.thingService.loadLatestThingClient()
    }

    const creds = await this.auth.waitCredentials()

    const name = machineId(
      this.options.awsResources.stackName + '/' + creds.identityId
    )

    try {
      this.thingService.tryRegisterThing(name)
    } catch (err) {
      console.log('e', err)
    }

    return this.thingService.loadThingClient(name)
  }
}
