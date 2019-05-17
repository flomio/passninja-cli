"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudform_1 = require("cloudform");
exports.AuthenticatedUserRole = new cloudform_1.IAM.Role({
    RoleName: 'pass-ninja-authenticated-user-role',
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
                        'cognito-identity.amazonaws.com:aud': cloudform_1.Fn.Ref('IdentityPool')
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated'
                    }
                }
            }
        ]
    }
});
//# sourceMappingURL=AuthenticatedUserRole.js.map