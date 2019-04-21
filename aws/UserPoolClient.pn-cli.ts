import { Cognito, Fn } from 'cloudform'

export const UserPoolClientPnCli = new Cognito.UserPoolClient({
  ClientName: 'pn-cli-user-pool-client',
  UserPoolId: Fn.Ref('UserPool')
})
