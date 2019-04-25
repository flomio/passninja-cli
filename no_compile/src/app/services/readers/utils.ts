import { dbg } from "../../logging"
import { FloBlePlusBase } from "flomio-js-sdk"

export const pollVAS = async reader => {
  dbg("Polling for vas targets")
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

export const selectOSE = async (tag, tries = 2) => {
  const select = await tag.selectApplication(Buffer.from("OSE.VAS.01"))
  dbg("Select VAS", select.SW)
  tries--

  if (tries && !select.OK) {
    return
  }

  return select
}

export const initReaderAndGetSpec = async reader => {
  await reader.connect("direct")

  let firmware: string

  try {
    firmware = (await reader.escapeCommand("E0 00 00 18 00").response).data
      .slice(5)
      .toString("ascii")
  } catch (err) {
    dbg("Error getting firmware")
    return
  }

  try {
    pollVAS(reader)
  } catch (err) {
    dbg("Error while polling for vas", { firmware })
    return
  }

  let serialNumber: string

  try {
    serialNumber = await FloBlePlusBase.prototype.getSerialNumber.call(reader)
  } catch (err) {
    dbg("Error while polling for vas", { firmware })
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
