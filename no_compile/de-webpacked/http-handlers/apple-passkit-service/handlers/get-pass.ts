import { NotFound } from 'http-errors';
import { PasskitWebProtocolService } from '../db/passkit-web-protocol.service';
import { StateStoreService } from 'no_compile/de-webpacked/services/store';

export class GetPassHandler {
  static path = '/:version/passes/:passTypeIdentifier/:serialNumber';

  constructor(
    private store: StateStoreService,
    private service: PasskitWebProtocolService
  ) {}

  /**
   * /{version}/devices/
   *      {deviceLibraryIdentifier}
   *      /registrations/
   *        {passTypeIdentifier}/{serialNumber}
   */

  handle = (args: any) => {
    const req = args.req;
    const res = args.res;
    const params = req.params;
    const pass = this.store.findPass(params).pass;

    if (pass) {
      res.header('Content-Type', 'application/vnd.pkpass');
      res.header('Last-Modified', pass.lastModified);
      return pass.buffer;
    } else {
      throw new NotFound();
    }
  };

  // /passkit-service/v1/passes/pass.com.ndudfield.nfc/MDkwEwYHKoZIzj0CAQYIK
}
