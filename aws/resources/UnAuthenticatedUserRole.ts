import { IAM } from 'cloudform'

export const UnAuthenticatedUserRole = new IAM.Role({
  RoleName: 'pass-ninja-unauthenticated-user-role',
  AssumeRolePolicyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: [],
        Effect: 'Deny',
        Resource: '*'
      }
    ]
  }
})
