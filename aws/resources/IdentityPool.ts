import { Cognito, Fn, Refs } from 'cloudform';

export const IdentityPool = new Cognito.IdentityPool({
  IdentityPoolName: Fn.Join('', ['PassNinja', 'IdentityPool', Fn.Ref('Stage')]),
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
});
