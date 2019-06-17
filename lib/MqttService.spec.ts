import { MqttService } from './MqttService';
import { Configuration } from './Configuration';
import { AuthService } from './AuthService';

describe('MqttService', () => {

  it('should connect', async () => {
    const config = new Configuration();
    const auth = new AuthService(config);
    const mqtt = new MqttService(config, auth);

    expect(mqtt.connected).toEqual(false);

    await auth.login();

    expect(auth.loggedIn).toEqual(true);

    await mqtt.connect();

    expect(mqtt.connected).toEqual(true);
  });
});
