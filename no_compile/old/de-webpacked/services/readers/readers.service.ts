// var utils_2 = __webpack_require__(/*! flomio-js-sdk-pcsc/dist/utils */ \"../flomio-js-sdk-pcsc/dist/utils.js\");

// var abstract_session_handler_service_1 = __webpack_require__(/*! ./sessions/abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");

import * as crypto from "crypto"
import { Injectable, Inject, Output, EventEmitter } from "@angular/core"
import { v4 } from "uuid"
import { EnvironmentService } from "../env/environment.service"
import { EventBus } from "../event-bus"
import { dbg, trc } from "src/app/logging"
import { CONFIG_TOKEN } from "src/app/injection-tokens"
import { initReaderAndGetSpec, selectOSE } from "./utils"
import { fromBase64, toBase64 } from "./session-utils"
import { vasData, errorSelectOse, smartTapData } from "../../events"
import { CommandKey } from "./messages"
import * as pcsc from "flomio-js-sdk-pcsc"

function createSha256(data) {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest()
    .toString("hex")
    .toUpperCase()
}

export function generateGVD(passTypeIdentifier) {
  return (
    "80CA0101369F220201009F2520" +
    createSha256(passTypeIdentifier) +
    "9F2804C" +
    "5266B6E9F260400000002"
  )
}

@Injectable()
export class ReadersService {
  private session: any

  constructor(
    @Inject(CONFIG_TOKEN) private config: any,
    private events: EventBus,
    private env: EnvironmentService,
    private readerSession: SessionHandlerService
  ) {}

  start = () => {
    const connectionMode =
      this.env.platform() === "win32" ? "shared" : "exclusive"

    dbg("Creating pcsc.Session with", { connectionMode })

    this.session = new pcsc.Session({
      connectionMode
    })

    this.session.on("reader", this.onReader.bind(this))
  }

  onReader = async reader => {
    const spec = await initReaderAndGetSpec(reader)
 
    dbg("Found reader", spec)

    const withSpec = { reader, spec }

    reader.on("tagScanned", this.onTag.bind(this, withSpec))
  }

  onTag = (reader, tag) => {
    // TODO: handle unknown tags and pray
    if (tag.type === "hceDevice") {
      return this.onHceDevice(reader, tag)
    }
  }

  onHceDevice = async (reader, tag) => {
    const selected = selectOSE(tag)

    if (!selected.OK) {
      // TODO: more info! typed events!
      this.events.emit(errorSelectOse, {
        SW: selected.SW
      })
      return
    }

    try {
      if (!selected.data.toString().includes("ApplePay")) {
        await this.onApplePay(tag, reader)
      } else {
        await this.onSmartTap(selected, tag, reader)
      }
    } catch (err) {
      dbg("Scan error", err)
      this.eject(reader.reader)
      return
    }
  }

  reset = reader => {
    dbg("Resetting tag")
    reader.disconnect("reset").then()
  }

  unpower = reader => {
    dbg("Un-powering tag")
    reader.disconnect("unPower").then()
  }

  eject = reader => {
    dbg("Ejecting tag")
    reader.disconnect("eject").then()
  }

  onSmartTap = async (selectResp, tag, readerWithSpec) => {
    if (!(this.readerSession.isLocal() || this.readerSession.isLocal())) {
      return
    }

    dbg("Double selecting to delay")
    const selectResp = await selectOSE(tag)

    const reader = readerWithSpec.reader

    const selectOSEMsg = {
      cmd: CommandKey.select_ose,
      args: {
        // TODO: seems senseless to encode as string when session handler
        // is running locally
        response: selectResp.full.toString("base64"),
        passTypeIdentifier: this.config.nfc.selectPassTypeIdentifier,
        collectorId: this.config.nfc.selectCollectorId
      }
    }

    let resp = await this.readerSession.handleMessage(selectOSEMsg)

    trc("Select", resp)

    const responses = []

    if (!(resp.cmd === CommandKey.get_smart_tap_data)) {
      return
    }

    const negotiateApdu = fromBase64(resp.args.negotiate)

    trc("Negotiate apdu", negotiateApdu.length)

    const negotiateResp = await tag.sendAPDU(negotiateApdu)

    trc("Negotiate resp", negotiateResp.SW)

    if (!negotiateResp.OK) {
      dbg("Error with negotiate resp", negotiateResp.SW)

      const tackyTag = tag

      if (!tackyTag["__retried"]) {
        tackyTag["__retried"] = true

        return [2 /*return*/, this.onTag(readerWithSpec, tag)]
      } else {
        // Don't try and auto scan it again, assume it's something weird
        this.eject(reader)
        return
      }
    }

    const apdu = fromBase64(resp.args.get)
    // apdu[apdu.length - 1] = 255
    trc("Get apdu", apdu.length, "LE=", apdu.slice(-1))

    let apduResp = await tag.sendAPDU(apdu)

    const rem = parseInt(apduResp.SW, 16) ^ 0x9100

    if (rem && rem !== 0x100) {
      // Don't try and auto scan it again, assume it's something weird
      this.eject(reader)
      return
    }
    // TODO: handle non 91xx/90xx here

    dbg("GSTD resp", apduResp.SW)

    responses.push(apduResp.full)

    if (!(apduResp.SW === "0x9100")) {
      return
    }

    trc("Sending get more apdu")

    apduResp = await tag.sendAPDU("90-C0-00-00-00-00")

    trc("Get more SW", apduResp.SW)

    responses.push(apduResp.full)

    dbg("Responses", responses.map(r => [utils_2.hex(r.slice(-2)), r.length]))

    this.unpower(reader)

    const serializedOrLiveSession = resp.session

    resp = await this.readerSession.handleMessage({
      session: serializedOrLiveSession,
      cmd: CommandKey.decrypt_smart_tap_data,
      args: {
        responses: responses.map(toBase64)
      }
    })

    this.events.emit(smartTapData, {
      uuid: v4(),
      // TODO: should use smartTap likely
      type: "smart-tap",
      reader: readerWithSpec.spec,
      data: resp.args.data,
      collectorId: selectOSEMsg.args.collectorId
    })
  }

  onApplePay = async (tag, readerWithSpec) => {
    const reader = readerWithSpec.reader

    // TODO: make this double selecting optional
    await selectOSE(tag)

    const selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier

    const gvd = await tag.sendAPDU(generateGVD(selectPassTypeIdentifier))

    dbg("GVD", gvd.SW)

    if (!(gvd.SW === "0x6287")) {
      return
    }

    this.reset(reader)

    if (!gvd.OK) {
      return
    }

    if (this.env.isLinux() || this.env.isOSX()) {
      // This works on rpi0w
      this.unpower(reader)
    } else {
      this.eject(reader)
    }

    const resp = await this.readerSession.handleMessage({
      cmd: CommandKey.decrypt_vas_data,
      args: {
        passTypeIdentifier: selectPassTypeIdentifier,
        response: toBase64(gvd.full)
      }
    })

    this.events.emit(vasData, {
      type: "apple-pay",
      uuid: v4(),
      data: resp.args.data,
      reader: readerWithSpec.spec,
      passTypeIdentifier: selectPassTypeIdentifier
    })

    trc("GVD resp", gvd.SW)

    this.reset(reader)
  }
}
