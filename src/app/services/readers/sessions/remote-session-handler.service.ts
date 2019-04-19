import { Injectable, Inject } from "@angular/core"
import * as request from "request-promise-native"
import { CONFIG_TOKEN } from "src/app/injection-tokens"
import { trc, dbg } from "src/app/logging"
// var abstract_session_handler_service_1 = __webpack_require__(/*! ./abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");

@Injectable()
export class RemoteSessionHandlerService /** extends AbstractSessionHandler */ {
  constructor(@Inject(CONFIG_TOKEN) private config: any) {}

  handleMessage = async body => {
    dbg("Sending rpc request")
    trc("Sending rpc request", body)

    const newVar = request.post({
      uri:
        this.config.sessionServer.baseUrl || "http://localhost:4000/smart-tap",
      resolveWithFullResponse: true,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    })

    dbg("Got http response")

    return JSON.parse(newVar.body as string)
  }

  isLocal = () => false
}
