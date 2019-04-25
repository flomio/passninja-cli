import { IAM, Fn } from 'cloudform'

export const AuthenticatedUserPolicy = new IAM.Policy({
  PolicyName: 'pass-ninja-authenticated-user-policy',
  Roles: [Fn.Ref('AuthenticatedUserRole')],
  PolicyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: [
          'iot:AttachPrincipalPolicy',
          'iot:DescribeEndpoint',
          'iot:Connect',
          'iot:Publish',
          'iot:Subscribe',
          'iot:Receive',
          'iot:GetThingShadow',
          'iot:UpdateThingShadow',
          'iot:DeleteThingShadow',
          'iot:ListPrincipalThings',
          'iot:CreateKeysAndCertificate',
          'iot:CreateCertificateFromCsr',
          'iot:UpdateThing',
          'iot:CreateThing',
          'iot:DescribeThing',
          'iot:DeleteThing'
        ],
        Resource: '*',
        Effect: 'Allow'
      }
    ]
  }
})
