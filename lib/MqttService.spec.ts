import { take } from 'rxjs/operators';
import { CognitoIdentityCredentials, config as awsConfig } from 'aws-sdk';
import { MqttService } from './MqttService';
import { ConfigurationService } from './ConfigurationService';
import { AuthService } from './AuthService';

jest.setTimeout(120000);

describe('MqttService', () => {
  const config = new ConfigurationService();
  const auth = new AuthService(config);
  let mqtt: MqttService;


  beforeAll(function() {
    return new Promise(async resolve => {
      await auth.login('demo@user.com', 'Password123!');
      resolve();
    });
  });

  beforeEach(function() {
    expect(auth.loggedIn).toEqual(true);
    mqtt = new MqttService(config, auth);
  });

  it('should connect and disconnect', async function(done) {
    expect(mqtt.connected).toEqual(false);
    mqtt.connect();
    expect(mqtt.connecting).toEqual(true);

    setTimeout(() => {
      expect(mqtt.connected).toEqual(true);
      mqtt.disconnect();
      expect(mqtt.connected).toEqual(false);
      done();
    }, 2000);
  });

  it('should subscribe to the correct topic', async function() {
    let identityId = (awsConfig.credentials as CognitoIdentityCredentials).identityId;
    let expectedTopic = "passScans/"+identityId;
    expect(mqtt.topic).toEqual(expectedTopic);
    await mqtt.connect();
    const res = await mqtt.subscribe();
    expect(res).toEqual([{ 'qos': 1, 'topic': "passScans/"+auth.identityId }]);
    mqtt.disconnect();
  });

  it('should publish to the correct topic', async function(done) {
    let identityId = (awsConfig.credentials as CognitoIdentityCredentials).identityId;
    let expectedTopic = "passScans/"+identityId;
    expect(mqtt.topic).toEqual(expectedTopic);
    await mqtt.connect();
    await mqtt.subscribe();

    const testMessage = { message: 'testing yo' };

    mqtt.messages$.pipe(take(2)).subscribe(({ topic, message }) => {
      if (topic === mqtt.topic) {
        expect(message).toEqual(JSON.stringify(testMessage as any));
        mqtt.disconnect();
        done();
      }
    });

    expect(await mqtt.publish(testMessage)).toEqual(undefined);
  });

});
