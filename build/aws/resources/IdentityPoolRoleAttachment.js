"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudform_1 = require("cloudform");
exports.AuthenticatedRoleAttachment = new cloudform_1.Cognito.IdentityPoolRoleAttachment({
    IdentityPoolId: cloudform_1.Fn.Ref('IdentityPool'),
    Roles: {
        authenticated: cloudform_1.Fn.GetAtt('AuthenticatedUserRole', 'Arn')
    }
});
exports.UnAuthenticatedRoleAttachment = new cloudform_1.Cognito.IdentityPoolRoleAttachment({
    IdentityPoolId: cloudform_1.Fn.Ref('IdentityPool'),
    Roles: {
        unauthenticated: cloudform_1.Fn.GetAtt('UnAuthenticatedUserRole', 'Arn')
    }
});
//# sourceMappingURL=IdentityPoolRoleAttachment.js.map