import { IProgram } from '../bin/pn'

// import { AuthorizationService } from './AuthorizationService'
import { Reader } from './reader/Reader'
import { LocalSessionHandler } from './reader/sessions/LocalSessionHandler'
import * as fs from 'fs'

const nfcKeys = process.env.PN_NFC_KEYS && fs.existsSync(process.env.PN_NFC_KEYS) ?
  JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString()) : undefined

export const configure = (program: IProgram) => {
  // const auth = new AuthorizationService()
  const config = {
    nfc: {
      // PassNinjaDemo
      selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
      selectCollectorId: 77501435,
      keys: nfcKeys
    }
  }
  const localSession = new LocalSessionHandler(config)
  const readerSession = new Reader(localSession, config)
  readerSession.start()
}
