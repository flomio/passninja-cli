import { Program } from './pn';
import { ConfigurationService } from '../lib/ConfigurationService';
import { AuthService } from '../lib/AuthService';
import { MqttService, SmartTapScan, ApplePayScan } from '../lib/MqttService';
import { v1 } from 'uuid';

const now = new Date();

const reader = {
  type: 'FloBlePlus',
  /*eslint-disable */
  serial_number: 'RR464-0017564',
  /*eslint-enable */
  firmware: 'ACR1255U-J1 SWV 3.00.05'
};

const googleScan: SmartTapScan = {
  reader,
  uuid: v1(),
  type: 'smart-tap',
  collectorId: 12947583,
  data: {
    redemptions: [
      {
        smartTapValue: 'smartTapValue',
        kind: 'kind'
      }
    ]
  }
};

const appleFlightScan: ApplePayScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.ndudfield.nfc',
  data: {
    timeStamp: now.toISOString(),
    message: '357291.35101723264'
  }
};

const appleEventTicketScan: ApplePayScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.ndudfield.nfc',
  data: {
    timeStamp: now.toISOString(),
    message: 'e8f33d58-10f5-433a-8836-a04d2549af9f'
  }
};

const appleCouponScan: ApplePayScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.ndudfield.nfc',
  data: {
    timeStamp: now.toISOString(),
    message: '3186bdfc-a013-4860-9d1f-1ca0a98dfb6f'
  }
};

const appleGiftScan: ApplePayScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.ndudfield.nfc',
  data: {
    timeStamp: now.toISOString(),
    message: 'fa5ba873-d87f-4bc9-b301-a68d1c20deb8'
  }
};

const appleLoyaltyScan: ApplePayScan = {
  reader,
  uuid: v1(),
  type: 'apple-pay',
  passTypeIdentifier: 'pass.com.ndudfield.nfc',
  data: {
    timeStamp: now.toISOString(),
    message: '7eea7d2c-df44-40a3-badc-93ae2fd64c91'
  }
};

export const spoof = (
  program: Program,
  type:
    | 'google'
    | 'appleFlight'
    | 'appleLoyalty'
    | 'appleGift'
    | 'appleCoupon'
    | 'appleEvent'
) =>
  new Promise(async resolve => {
    const config = new ConfigurationService(program);

    const auth = new AuthService(config);
    await auth.login(program.username, program.password);

    const mqtt = new MqttService(config, auth);
    await mqtt.connect();

    const message =
      type === 'appleFlight'
        ? appleFlightScan
        : type === 'appleCoupon'
        ? appleCouponScan
        : type === 'appleLoyalty'
        ? appleLoyaltyScan
        : type === 'appleGift'
        ? appleGiftScan
        : type === 'appleEvent'
        ? appleEventTicketScan
        : googleScan;

    await mqtt.publish(message);
    mqtt.cleanUp();

    console.log(`topic: ${mqtt.topic}\nmessage: ${JSON.stringify(message)}\n`);
    resolve('done');
  });
