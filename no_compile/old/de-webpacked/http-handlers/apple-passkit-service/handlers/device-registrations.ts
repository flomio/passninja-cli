import { PasskitWebProtocolService } from '../db/passkit-web-protocol.service';
export class DeviceRegistrationsHandler {
  static path =
    '/:version' +
    '/devices/' +
    ':deviceLibraryIdentifier' +
    '/registrations/' +
    ':passTypeIdentifier';

  constructor(private service: PasskitWebProtocolService) {}

  handle = async (args: any) => {
    return await this.service.deviceRegistrations(args.req.params);
  };
}
