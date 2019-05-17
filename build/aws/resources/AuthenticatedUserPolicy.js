"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudform_1 = require("cloudform");
exports.AuthenticatedUserPolicy = new cloudform_1.IAM.Policy({
    PolicyName: 'pass-ninja-authenticated-user-policy',
    Roles: [cloudform_1.Fn.Ref('AuthenticatedUserRole')],
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
});
//# sourceMappingURL=AuthenticatedUserPolicy.js.map