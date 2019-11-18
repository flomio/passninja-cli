import { Program } from './pn';
import { ConfigurationService } from '../lib/ConfigurationService';
import { AuthService } from '../lib/AuthService';
import { MqttService } from '../lib/MqttService';
import { Reader } from '../lib/Reader';
import { SessionHandler } from '../lib/SessionHandler';

export const scan = async (program: Program) => {
  const config = new ConfigurationService(program);

  let mqtt: MqttService | undefined;

  if (config.mqtt) {
    const { username, password } = program;
    const auth = new AuthService(config);
    await auth.login(username, password);

    mqtt = new MqttService(config, auth);
    await mqtt.connect();
    await mqtt.subscribe();
  }

  const localSession = new SessionHandler(config);

  const readerSession = new Reader(config, localSession, mqtt);

  readerSession.start();

  console.log(`>>>\n>>>\n>>>`);

  if (config.mqtt) {
    // if config.mqtt is true then mqtt and mqtt.topic will both be defined to get to here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    console.log('>>> publishing scans via mqtt to topic: ' + mqtt!.topic);
  }

  if (config.http) {
    console.log(
      '>>>\n>>> publishing scans via http POST to: ' + (await config.httpUrl)
    );
  }

  console.log(`>>>
>>>
>>>
>>> SCANNER STARTED
>>>
>>>
>>> POLLING FOR
>>>
>>> collectorId: ${config.collectorId}
>>> passTypeIdentifier: ${config.passTypeIdentifier}
>>>
>>>`);
};
