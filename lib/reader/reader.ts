
import * as pcsc from 'flomio-js-sdk-pcsc'
import * as crypto from 'crypto'
import { SessionHandler } from './sessions/abstract-session-handler';
import * as os from 'os'
import { Session } from 'flomio-js-sdk-pcsc';
import { FloBlePlusBase, IType4Tag } from "flomio-js-sdk"
import { CardReader } from 'flomio-js-sdk-pcsc/dist/pcsclite-interfaces';
import * as flomio from 'flomio-js-sdk'
import { CommandKey } from './messages';

export function generateGVD(passTypeIdentifier: string) {
  return (
    '80CA0101369F220201009F2520' +
    createSha256(passTypeIdentifier) +
    '9F2804C' +
    '5266B6E9F260400000002'
  )
}

function createSha256(data: string) {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest()
    .toString("hex")
    .toUpperCase()
}

export const toBase64 = (buffer: Buffer) => {
  return buffer.toString("base64")
}

export const fromBase64 = (str: string) => {
  return Buffer.from(str, "base64")
}

export class Reader {
  private session?: pcsc.Session;
  
  constructor(
    private readerSession: SessionHandler,
    private config: any
  ) {}

  start = () => {
    const connectionMode = os.platform() === "win32" ? "shared" : "exclusive"
    console.log("Creating pcsc.Session with", { connectionMode })
    this.session = new pcsc.Session({
      connectionMode
    })

    this.session.on('reader', async (reader) => {
      const spec = await this.initReaderAndGetSpec(reader)
      console.log("Found reader", spec)

      // log('what', await flomio.licensing.isRegistered(reader))
      console.log('reader', JSON.stringify(reader.name))
      reader.on('tagScanned', async (tag: flomio.ITag) => {
        console.log('tagScanned')
        console.log(tag.type)
        if (tag.type === "hceDevice") {
          return this.onHceDevice(reader, tag as flomio.tags.HCEDevice)
        }
      })
    })
  }

  onHceDevice = async (reader: pcsc.PCSCReader, tag: flomio.tags.HCEDevice) => {
    const selected = await this.selectOSE(tag)

    if (!selected || !selected.OK) {
      console.log('!selected || !selected.OK')
      // TODO: more info! typed events!
      // this.events.emit(errorSelectOse, {
      //   SW: selected.SW
      // })
      return
    }

    try {
      if (selected.data.toString().includes("ApplePay")) {
        await this.onApplePay(tag, reader)
      } else {
        // await this.onSmartTap(selected, tag, reader)
      }
    } catch (err) {
      console.log("Scan error", err)
      this.eject(reader)
      return
    }
  }

  eject = (reader: pcsc.PCSCReader) => {
    console.log("Ejecting tag")
    reader.disconnect("eject").then()
  }

  onApplePay = async (tag: flomio.tags.HCEDevice, readerWithSpec: any) => {
    try {
      const reader = readerWithSpec.reader

      // TODO: make this double selecting optional
      await this.selectOSE(tag)
  
      const selectPassTypeIdentifier = this.config.nfc.selectPassTypeIdentifier
      const gvd = await tag.sendAPDU(generateGVD(selectPassTypeIdentifier))
  
      console.log("GVD", gvd.SW)
  
      // if (!(gvd.SW === "0x6287")) {
      //   return
      // }
  
      // await this.reset(reader)
  
      // if (!gvd.OK) {
      //   return
      // }
  
      // if (process.env.isLinux() || this.env.isOSX()) {
        // This works on rpi0w
      // await this.unpower(reader)
      // } else {
      //   this.eject(reader)
      // }
  
      const resp = await this.readerSession.handleMessage(
        CommandKey.decrypt_vas_data,
        {
          passTypeIdentifier: selectPassTypeIdentifier,
          response: toBase64(gvd.full)
        }
      )
  
  
      // this.events.emit(vasData, {
      //   type: "apple-pay",
      //   uuid: v4(),
      //   data: resp.args.data,
      //   reader: readerWithSpec.spec,
      //   passTypeIdentifier: selectPassTypeIdentifier
      // })
  
      console.log("GVD resp", gvd.SW)
      console.log(JSON.stringify(resp.args.data))
      // this.reset(reader)
  
    } catch (e) {
      console.log('onApplePay Error') //delete
      console.log(JSON.stringify(e))
    }
    
  }

  reset = async (reader: any) => {
    console.log('resetting tag')
    await reader.disconnect("reset").then().catch()
  }

  unpower = async (reader: any) => {
    await reader.disconnect("unPower").then().catch()
  }
  
  initReaderAndGetSpec = async (reader: pcsc.PCSCReader) => {
    await reader.connect("direct")
  
    let firmware: string
  
    try {
      firmware = (await reader.escapeCommand("E0 00 00 18 00").response).data
        .slice(5)
        .toString("ascii")
    } catch (err) {
      console.log("Error getting firmware")
      return
    }
  
    try {
      this.pollVAS(reader)
    } catch (err) {
      console.log("Error while polling for vas", { firmware })
      return
    }
  
    let serialNumber: string
  
    try {
      serialNumber = await FloBlePlusBase.prototype.getSerialNumber.call(reader)
    } catch (err) {
      console.log("Error while polling for vas", { firmware })
      return
    }
  
    await reader.disconnect("leave")
  
    return {
      type: reader.name.includes("1255")
        ? "FloBLE-Plus"
        : reader.name.includes("1311")
        ? "FloBLE-Micro"
        : "unknown",
      serial_number: serialNumber,
      firmware
    }
  }

  pollVAS = async (reader: pcsc.PCSCReader) => {
    console.log("Polling for vas targets")
    // ECP version = 1
    await reader.escapeCommand("E000003B03010101").response
    // Terminal type = 0
    await reader.escapeCommand("E000003B03010200").response
    // Terminal mode = VAS only
    await reader.escapeCommand("E000003B03010302").response
    // include VAS types in polling
    // TODO: ...
    await reader.escapeCommand("E00000200145").response
    // include VAS types in polling
  }

  selectOSE = async (tag: IType4Tag, tries = 2) => {
    const select = await tag.selectApplication(Buffer.from("OSE.VAS.01"))
    console.log("Select VAS", select.SW)
    tries--
    if (tries && !select.OK) {
      return
    }
  
    return select
  }
}