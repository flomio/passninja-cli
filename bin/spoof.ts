import { Program } from './pn';
import { ConfigurationService } from '../lib/ConfigurationService';
import { AuthService } from '../lib/AuthService';
import { MqttService } from '../lib/MqttService';

const reader = {
  type: 'FlowBePlus',
  serial_number: 'serial_number',
  firmware: '1.0'
};

const googleScan = {
  reader,
  uuid: 'uuid',
  type: 'smart-tap',
  data: {
    redemptions: [{
      smartTapValue: 'smartTapValue',
      kind: 'kind'
    }]
  }
};

const appleScan = {
  reader,
  uuid: 'uuid',
  type: 'apple-pay',
  passTypeIdentifier: 'passTypeIdentifier',
  data: {
    timeStamp: 'timestamp',
    message: 'message'
  }
};

export const spoof = (type: 'google' | 'apple', program?: Program) => new Promise(async resolve => {
  const config = new ConfigurationService(program && program.debug);
  const auth = new AuthService(config);

  program
    ? await auth.login(program.username, program.password)
    : await auth.login();

  const mqtt = new MqttService(config, auth);
  await mqtt.connect();

  const message = type === 'google' ? googleScan : appleScan;
  await mqtt.publish(JSON.stringify(message));
  mqtt.cleanUp();

  return resolve({ topic: mqtt.topic, message });
});
