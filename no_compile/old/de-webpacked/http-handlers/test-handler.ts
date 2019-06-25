import { dbg } from '../logging';
import { SocketServerService } from '../services/socket-server.service';

export class TestHandler {
  constructor(private sockets: SocketServerService) {}

  handle = (args: any) => {
    dbg('Body', args);
    const subscribers = this.sockets.sendAll({ ok: true });
    dbg('Sent to', subscribers, 'subscribers');

    return { ok: true };
  };
}
