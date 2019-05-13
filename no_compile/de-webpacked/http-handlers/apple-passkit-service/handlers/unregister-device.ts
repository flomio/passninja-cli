import { PasskitWebProtocolService } from '../db/passkit-web-protocol.service';

export class UnregisterDeviceHandler {
  static path =
    '/:version' +
    '/devices/' +
    ':deviceLibraryIdentifier' +
    '/registrations/' +
    ':passTypeIdentifier/:serialNumber';

  constructor(private service: PasskitWebProtocolService) {}

  /**
   * /{version}/devices/
   *      {deviceLibraryIdentifier}
   *      /registrations/
   *        {passTypeIdentifier}/{serialNumber}
   */

  handle = async (args: any) => {
    const body = args.body;
    const req = args.req;
    const res = args.res;
    const params = req.params;
    const all = Object.assign({}, body, params);

    logging_1.dbg('unregister device', all, req.url);

    await this.service.unregisterDevice(all);

    res.status(200);
    res.send(null);
  };
}
