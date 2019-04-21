const region = process.env.REGION || 'us-east-1'
const env = process.env.NODE_ENV || 'development'
const stack = `passninja-${env}`
const userPoolId = `${process.env.USER_POOL_ID}`
const identityPoolId = `${process.env.IDENTITY_POOL_ID}`
const userPoolClientId = `${process.env.USER_POOL_CLIENT_ID}`
const federation = 'cognito-idp.' + region + '.amazonaws.com/' + userPoolId
const iotEndpoint = `${process.env.IOT_ENDPOINT}`

export const options = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  resources: {
    stack,
    region,
    userPoolClientId,
    userPoolId,
    identityPoolId,
    federation,
    iotEndpoint
  }
}

export declare type PassNinjaCliOptions = typeof options
