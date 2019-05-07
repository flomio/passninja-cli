import { Cognito, Fn } from 'cloudform';

export const IdentityPoolRoleAttachment = new Cognito.IdentityPoolRoleAttachment(
  {
    IdentityPoolId: Fn.Ref('IdentityPool'),
    Roles: {
      authenticated: Fn.GetAtt('AuthenticatedUserRole', 'Arn'),
      unauthenticated: Fn.GetAtt('UnAuthenticatedUserRole', 'Arn')
    }
  }
);
