import { MqttService } from './MqttService';
import { Configuration } from './Configuration';
import { AuthService } from './AuthService';
import { take } from 'rxjs/operators';

describe('MqttService', () => {
  const config = new Configuration();
  const auth = new AuthService(config);
  let mqtt: MqttService;

  beforeEach(async () => {
    if (!auth.loggedIn) {
      await auth.login();
    }
    expect(auth.loggedIn).toEqual(true);
    mqtt = new MqttService(config, auth);
  });

  afterEach(() => {
    mqtt.disconnect()
  });

  it('should connect and disconnect', async () => {
    expect(mqtt.connected).toEqual(false);
    await mqtt.connect();
    expect(mqtt.connected).toEqual(true);
    mqtt.disconnect();
    expect(mqtt.connected).toEqual(false);
  });

  it('should subscribe to the correct topic', async () => {
    await mqtt.connect();
    const res = await mqtt.subscribe();
    expect(res).toEqual([{ 'qos': 0, 'topic': auth.identityId }]);
  });

  it('should publish to the correct topic', async done => {
    await mqtt.connect();
    await mqtt.subscribe();
    const testMessage = 'testing yo';
    mqtt.messages$.pipe(take(1)).subscribe(message => {
      expect(message.message).toEqual(testMessage);
      done();
    });
    expect(await mqtt.publish(testMessage)).toEqual(undefined);
  });

});
