import { CommandKey } from 'lib/utils';

export abstract class SessionHandler {
  abstract handleMessage (
    message: {
      cmd: CommandKey,
      args: any,
      session?: any
    }
  ): any
}
