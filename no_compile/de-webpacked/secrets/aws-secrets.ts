import { dbg } from '../logging';
import * as AWS from 'aws-sdk';

const _getPNDemoSecrets = async (region: string, secretId: string) => {
  const secrets = new AWS.SecretsManager({ region: region });

  const resp = await secrets.getSecretValue({ SecretId: secretId }).promise();

  const parsed = JSON.parse(resp.SecretString!);

  dbg('Got secrets', Object.keys(parsed));

  return parsed;
};

let cached: any = null;

export const getPNDemoSecrets = async options => {
  if (!!cached) {
    return cached;
  }

  if (!(options.awsResources && options.awsResources.ninjaKeysArn)) {
    throw new Error('Must set awsResourcesTest.ninjaKeysArn');
  }

  cached = await _getPNDemoSecrets(
    // arn:aws:$service:$region:...
    options.awsResources.ninjaKeysArn.split(':')[3],
    options.awsResources.ninjaKeysArn
  );

  return cached;
};
