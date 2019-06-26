import { CommandKey } from '../lib/reader/Messages'

export abstract class SessionHandler {
  abstract handleMessage (
    message: {
      cmd: CommandKey,
      args: any,
      session?: any
    }
  ): any
}
