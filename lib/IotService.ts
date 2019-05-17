import {
  IotClient,
  OnMessageHandler,
  OnConnectHandler,
  OnCloseHandler
} from './IotClient';

import { CleanUpService } from './CleanUpService';

import { Configuration } from './Configuration';

import { AuthorizationService } from './AuthorizationService';

import { Iot, CognitoIdentityCredentials } from 'aws-sdk';

export declare interface InitNewIotClient {
  auth: AuthorizationService;
  config: Configuration;
}
export const initNewClient = ({ auth, config }: InitNewIotClient) => {
  const { accessKeyId, secretAccessKey, sessionToken } = auth.credentials;
  const { region, brokerUrl } = config;
  const client = new IotClient(
    {
      accessKeyId,
      secretKey: secretAccessKey,
      sessionToken,
      region,
      host: brokerUrl
    },
    true
  );
  // console.log(client);
};

export const updateClientCredentials = ({
  accessKeyId,
  secretAccessKey,
  sessionToken
}: CognitoIdentityCredentials) => {
  const client = new IotClient();
  client.updateWebSocketCredentials(accessKeyId, secretAccessKey, sessionToken);
};

export const unsubscribeFromTopics = (topics: string[]) => {
  const client = new IotClient();
  topics.forEach(topic => {
    client.unsubscribe(topic);
  });
};

export const attachMessageHandler = (handler: OnMessageHandler) => {
  const client = new IotClient();
  client.attachMessageHandler(handler);
};

export const attachConnectHandler = (onConnectHandler: OnConnectHandler) => {
  const client = new IotClient();
  client.attachConnectHandler(onConnectHandler);
};

export const attachCloseHandler = (handler: OnCloseHandler) => {
  const client = new IotClient();
  client.attachCloseHandler(handler);
};

export const publish = (topic: string, message: string) => {
  const client = new IotClient();
  client.publish(topic, message);
  // log.debug('published message', topic, message);
};

export const subscribe = (topic: string) => {
  const client = new IotClient();
  client.subscribe(topic);
  // log.debug('subscribed to', topic);
};
