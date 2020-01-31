import { Program } from './pn';
import { ConfigurationService } from '../lib/ConfigurationService';
import { AuthService } from '../lib/AuthService';
import { MqttService } from '../lib/MqttService';
import { v1 } from 'uuid';
const now = new Date();
  
const reader = {
  type: 'FloBlePlus',
  /*eslint-disable */
  serial_number: 'RR464-0017564',
  /*eslint-enable */
  firmware: 'ACR1255U-J1 SWV 3.00.05'
};

const googleScan = {
  reader,
  uuid: v1(),
  type: 'smart-tap',
  data: {
    redemptions: [
      {
        smartTapValue: 'smartTapValue',
        kind: 'kind'
      }
    ]
  }
};

const appleScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.passninja.demo.testing',
  data: {
    timeStamp: now.toISOString(),
    message: '357291.35101723264'
  }
};

const appleEventTicketScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.passninja.demo.testing',
  data: {
    timeStamp: now.toISOString(),
    message: 'e8f33d58-10f5-433a-8836-a04d2549af9f'
  }
};

const appleCouponScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.passninja.demo.testing',
  data: {
    timeStamp: now.toISOString(),
    message: '3186bdfc-a013-4860-9d1f-1ca0a98dfb6f'
  }
};

const appleGiftScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.passninja.demo.testing',
  data: {
    timeStamp: now.toISOString(),
    message: 'fa5ba873-d87f-4bc9-b301-a68d1c20deb8'
  }
};

const appleLoyaltyScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.passninja.demo.testing',
  data: {
    timeStamp: now.toISOString(),
    message: '7eea7d2c-df44-40a3-badc-93ae2fd64c91'
  }
};

export const spoof = (
  type:
    | 'google'
    | 'apple',
  program?: Program
) =>
  new Promise(async resolve => {
    const config = new ConfigurationService(program && program.debug);
    const auth = new AuthService(config);

    program
      ? await auth.login(program.username, program.password)
      : await auth.login();

    const mqtt = new MqttService(config, auth);
    await mqtt.connect();

    const message =
      type === 'apple'
        ? appleScan
        : googleScan;

    await mqtt.publish(message);
    mqtt.cleanUp();

    console.log(`topic: ${mqtt.topic}\nmessage: ${JSON.stringify(message)}\n`);
    resolve('done');
  });
