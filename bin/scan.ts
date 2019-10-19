import { Program } from './pn';
import { ConfigurationService } from '../lib/ConfigurationService';
import { AuthService } from '../lib/AuthService';
import { MqttService } from '../lib/MqttService';
import { Reader } from '../lib/Reader';
import { SessionHandler } from '../lib/SessionHandler';

export const scan = async (program: Program) => {
  const config = new ConfigurationService();

  const { username, password } = program;
  const auth = new AuthService(config);
  await auth.login(username, password);

  const mqtt = new MqttService(config, auth);
  await mqtt.connect();
  await mqtt.subscribe();

  const localSession = new SessionHandler(config);

  const readerSession = new Reader(config, localSession, mqtt);

  readerSession.start();

  console.log('started scanning to topic: ' + mqtt.topic);
};
