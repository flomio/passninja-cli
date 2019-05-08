import { IAM, Fn, Refs } from 'cloudform';

export const AuthenticatedUserPolicy = new IAM.Policy({
  PolicyName: 'pass-ninja-authenticated-user-policy',
  Roles: [Fn.Ref('AuthenticatedUserRole')],
  PolicyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
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
          'iot:CreateCertificateFromCsr'
        ],
        Resource: '*'
      },
      {
        Effect: 'Allow',
        Action: 'iot:AttachPrincipalPolicy',
        Resource: '*'
        // Condition: {
        //   ArnEquals: {
        //     'iot:PolicyArn': Fn.Join('', [
        //       'arn:aws:iot:*:448311138761:policy/',
        //       Refs.StackName,
        //       '/',
        //       'cognitos-own'
        //     ])
        //   }
        // }
      },
      {
        Effect: 'Allow',
        Action: ['iot:AttachThingPrincipal', 'iot:DetachThingPrincipal'],
        Resource: '*'
        // Condition: {
        //   ArnEquals: {
        //     'iot:ThingArn': {
        //       'Fn::Sub':
        //         'arn:aws:iot:*:{AWS::AccountId}:thing/${AWS::StackName}/${!cognito-identity.amazonaws.com:sub}/*'
        //     }
        //   }
        // }
      },
      {
        Effect: 'Allow',
        Action: [
          'iot:UpdateThing',
          'iot:CreateThing',
          'iot:DescribeThing',
          'iot:DeleteThing'
        ],
        Resource: '*'
        // Resource: {
        //   'Fn::Sub':
        //     'arn:aws:iot:*:{AWS::AccountId}:thing/${AWS::StackName}/${!cognito-identity.amazonaws.com:sub}/*'
        // }
      }
    ]
  }
});
