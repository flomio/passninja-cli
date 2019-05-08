import { IAM, Fn } from 'cloudform';

export const AuthenticatedUserRole = new IAM.Role({
  RoleName: Fn.Join('-', [
    'pass-ninja',
    Fn.Ref('Stage'),
    'authenticated-user-role'
  ]),
  AssumeRolePolicyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Federated: 'cognito-identity.amazonaws.com'
        },
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': Fn.Ref('IdentityPool')
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated'
          }
        }
      }
    ]
  }
});
