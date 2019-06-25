import { dbg } from '../../../logging';
import { PasskitWebProtocolService } from '../db/passkit-web-protocol.service';

export class LogHandler {
  static path = '/:version/log/';

  constructor(private service: PasskitWebProtocolService) {}

  /**
   * /{version}/log/
   */

  handle = function(args) {
    const body = args.body;
    const req = args.req;
    const res = args.res;

    body.logs.forEach(dbg);

    res.status(200);
    res.send(null);
  };
}
