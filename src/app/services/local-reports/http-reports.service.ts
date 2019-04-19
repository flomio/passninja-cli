import { Injectable, Inject } from "@angular/core"
import { CONFIG_TOKEN } from "src/app/injection-tokens"
import { EventBus } from "../event-bus"
import { smartTapData, vasData } from "../../events"
import { dbg } from "../../logging"
import * as requestPromise from "request-promise-native"

@Injectable()
export class HttpReportsService {
  constructor(
    @Inject(CONFIG_TOKEN) private config: any,
    private events: EventBus
  ) {
    const reportEndPoint = config.args.scanReportEndPoint
    if (reportEndPoint) {
      const scanEvents = [
        // TODO: just use `scan`
        events_1.Events.smartTapData,
        events_1.Events.vasData
      ]
      scanEvents.forEach(event => {
        this.events.on(event, data => {
          requestPromise({
            method: "POST",
            url: reportEndPoint,
            body: JSON.stringify(data)
          }).catch(err => {
            const firstLine = err.message.split(`\\`)[0]
            dbg("Failed to post to", reportEndPoint, firstLine)
          })
        })
      })
    }
  }
}
