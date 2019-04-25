import { Cognito, Fn } from 'cloudform'

export const UserPoolClient = new Cognito.UserPoolClient({
  ClientName: Fn.Join('-', ['pass-ninja', Fn.Ref('Stage'), 'user-pool-client']),
  UserPoolId: Fn.Ref('UserPool'),
  ExplicitAuthFlows: ['USER_PASSWORD_AUTH'],
  GenerateSecret: false
})
