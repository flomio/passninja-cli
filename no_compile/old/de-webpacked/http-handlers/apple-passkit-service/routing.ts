import * as express from 'express';
import {
  ExpressAppHolder,
  handlePost,
  handleGet
} from 'no_compile/de-webpacked/services/express-app-holder';
import { LogHandler } from './handlers/log';
import { GetPassHandler } from './handlers/get-pass';
import { DeviceRegistrationsHandler } from './handlers/device-registrations';
import { UnregisterDeviceHandler } from './handlers/unregister-device';
import { RegisterDeviceHandler } from './handlers/register-device';
import { PasskitWebProtocolService } from './db/passkit-web-protocol.service';

export class PasskitRouting {
  constructor(
    private app: ExpressAppHolder,
    private log: LogHandler,
    private getPass: GetPassHandler,
    private registrations: DeviceRegistrationsHandler,
    private unregister: UnregisterDeviceHandler,
    private register: RegisterDeviceHandler
  ) {
    var subApp = express();
    app.expressApp.use('/passkit-service', subApp);
    subApp.post(RegisterDeviceHandler.path, handlePost({ handler: register }));
    subApp.post(LogHandler.path, handlePost({ handler: log }));
    subApp.get(
      DeviceRegistrationsHandler.path,
      handleGet({ handler: registrations })
    );
    subApp.get(
      GetPassHandler.path,
      handleGet({ handler: getPass, json: false })
    );
    subApp.delete(
      UnregisterDeviceHandler.path,
      handlePost({ handler: getPass, allowNoContentType: true })
    );
  }
}

export const applePasskitServiceProviders = [
  PasskitWebProtocolService,
  GetPassHandler,
  RegisterDeviceHandler,
  UnregisterDeviceHandler,
  DeviceRegistrationsHandler,
  LogHandler,
  PasskitRouting
];
