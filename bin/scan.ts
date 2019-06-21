import { Program } from './pn';
import { Configuration } from '../lib/Configuration';
import { AuthService } from '../lib/AuthService';
import { MqttService } from '../lib/MqttService';
import { Reader } from '../lib/Reader';
import { SessionHandler } from '../lib/SessionHandler';

export const scan = async (program: Program) => {

  const config = new Configuration();

  const { username, password } = program;
  const auth = new AuthService(config);
  await auth.login(username, password);

  const mqtt = new MqttService(config, auth);
  await mqtt.connect();
  await mqtt.subscribe();

  // mqtt.messages$.subscribe(obj => console.log(obj));
  //
  // mqtt.publish(JSON.stringify({ message: 'message?' }))
  //   .then(() => console.log('published'), err => console.error(err));

  const localSession = new SessionHandler(config);
  // @ts-ignore
  const readerSession = new Reader(config, localSession, mqtt);

  readerSession.start();

  console.log('started');
};
