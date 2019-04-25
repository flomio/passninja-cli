import { Cognito, Fn } from 'cloudform'

export const AuthenticatedRoleAttachment = new Cognito.IdentityPoolRoleAttachment(
  {
    IdentityPoolId: Fn.Ref('IdentityPool'),
    Roles: {
      authenticated: Fn.GetAtt('AuthenticatedUserRole', 'Arn')
    }
  }
)

export const UnAuthenticatedRoleAttachment = new Cognito.IdentityPoolRoleAttachment(
  {
    IdentityPoolId: Fn.Ref('IdentityPool'),
    Roles: {
      unauthenticated: Fn.GetAtt('UnAuthenticatedUserRole', 'Arn')
    }
  }
)
