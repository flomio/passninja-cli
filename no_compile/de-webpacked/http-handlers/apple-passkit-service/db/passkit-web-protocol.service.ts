import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { dbg } from '../../../logging';
import { LocalCertsService } from '../../../services/certs/local-certs.service';
import { DeviceRegistration, Device, Pass } from './models';
import { createConnection, Connection } from 'typeorm';
import { ApnNotifier } from 'passninja-passkit';

function configDir() {
  return path.join(os.homedir(), '.pn');
}

export class PasskitWebProtocolService {
  private _init = false;
  private connection!: Connection;
  private ngrokUrl!: string;
  private ready!: [Connection, string];

  constructor(private config: any, private certs: LocalCertsService) {}

  initLazy = async () => {
    if (this._init) {
      return this.ready;
    } else {
      this._init = true;
    }

    // TODO:
    this.ngrokUrl = process.env.NGROK_URL || '';
    //   ngrok.connect({
    //     region: 'ap',
    //     addr: config.server.port
    // })
    this.connection = await createConnection({
      logging: 'all',
      database: path.join(configDir(), 'passkit.db'),
      synchronize: true,
      type: 'sqlite',
      entities: [DeviceRegistration, Device, Pass]
    });

    this.ready = [this.connection, this.ngrokUrl];

    return this.ready;
  };
  deviceRegistrations = async (params: any) => {
    const connection = await this.connection;
    const registrations = connection.getRepository(DeviceRegistration);

    return registrations
      .createQueryBuilder('reg')
      .leftJoin('reg.device', 'device')
      .where('reg.passTypeIdentifier = :passTypeIdentifier')
      .andWhere('device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
      .setParameters(params)
      .getRawMany()
      .then((registrations: any[]) => {
        console.log('registrations', registrations);
        return {
          lastUpdated: new Date().toUTCString(),
          serialNumbers: registrations.map(function(r) {
            return r.reg_passSerialNumber;
          })
        };
      });
  };
  unregisterDevice = async (params: any) => {
    const connection = await this.connection;
    const registrations = connection.getRepository(DeviceRegistration);

    this.registrationQuery(registrations)
      .setParameters(params)
      .delete();
  };
  registrationQuery = async (registrations: any[]) => {
    return registrations
      .createQueryBuilder('reg')
      .leftJoin('reg.device', 'device')
      .leftJoin('reg.pass', 'pass')
      .where('device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
      .andWhere('pass.serialNumber = :serialNumber')
      .andWhere('pass.passTypeIdentifier = :passTypeIdentifier');
  };
  registerDevice = async (params: any) => {
    const connection = await this.connection;
    const registrations = connection.getRepository(DeviceRegistration);
    const devices = connection.getRepository(Device);
    const passes = connection.getRepository(Pass);

    const registered = this.registrationQuery(registrations)
      // TODO: is this same as above?
      /*registrations
    .createQueryBuilder('reg')
    .leftJoin('reg.device', 'device')
    .leftJoin('reg.pass', 'pass')
    .where(
      'device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
      .andWhere('pass.serialNumber = :serialNumber')
      .andWhere('pass.passTypeIdentifier = :passTypeIdentifier')*/
      .setParameters(params)
      .getOne();

    if (!registered) {
      const deviceParams = {
        deviceLibraryIdentifier: params.deviceLibraryIdentifier
      };

      const passParams = {
        passTypeIdentifier: params.passTypeIdentifier,
        serialNumber: params.serialNumber
      };

      dbg('saving device', deviceParams);
      dbg('saving pass', passParams);

      const device = devices.save(deviceParams);
      const pass = passes.save(passParams);

      await registrations.save({
        device: await device,
        pass: await pass,
        pushToken: params.pushToken
      });

      return 201;
    }

    return 200;
  };
  notifyUpdate = async (pass: any) => {
    const connection = await this.connection;
    const registrations = connection.getRepository(DeviceRegistration);
    const many = registrations
      .createQueryBuilder('reg')
      .select('distinct reg.pushToken')
      .leftJoin('reg.pass', 'pass')
      .where('pass.serialNumber = :serialNumber')
      .where('pass.passTypeIdentifier = :passTypeIdentifier ')
      .setParameters({
        passTypeIdentifier: pass.passTypeIdentifier,
        serialNumber: pass.serialNumber
      })
      .getRawMany();

    const tokens = many.map((ea: any) => {
      return ea.pushToken;
    });

    dbg('Found update tokens: ', tokens);

    if (this.config.args.certsPath) {
      const conf = this.certs.getPKPassCertSigningConfig(
        pass.passTypeIdentifier
      );
      const apn = new ApnNotifier(
        fs.readFileSync(conf.certPath),
        conf.passPhrase
      );
      tokens.forEach((t: any) => {
        return apn.pushUpdates(t);
      });
    }
  };
}
