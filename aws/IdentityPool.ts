import { Cognito, Fn } from 'cloudform'

export const IdentityPool = new Cognito.IdentityPool({
  IdentityPoolName: 'passninja-production-identity-pool',
  AllowUnauthenticatedIdentities: true,
  DeveloperProviderName: 'passninja.com',
  CognitoIdentityProviders: [
    {
      ClientId: Fn.Ref('UserPool'),
      ProviderName: Fn.GetAtt('UserPool', 'ProviderName'),
      ServerSideTokenCheck: false
    }
  ]
})
