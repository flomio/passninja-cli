import { Cognito, Fn, Refs } from 'cloudform'

export const IdentityPool = new Cognito.IdentityPool({
  IdentityPoolName: Fn.Join('', [Fn.Ref('Stage'), 'PassNinja', 'IdentityPool']),
  AllowUnauthenticatedIdentities: false,
  DeveloperProviderName: 'passninja.com',
  CognitoIdentityProviders: [
    {
      ClientId: Fn.Ref('UserPoolClient'),
      ServerSideTokenCheck: false,
      ProviderName: Fn.Join('', [
        'cognito-idp.',
        Refs.Region,
        '.amazonaws.com/',
        Fn.Ref('UserPool')
      ])
    }
  ]
})
