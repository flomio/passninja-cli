import { CommandKey } from '../messages'

export abstract class SessionHandler {
  abstract handleMessage(
    cmd: CommandKey,
    args: any
  ): any
}