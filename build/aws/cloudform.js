"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudform_1 = require("cloudform");
const UserPool_1 = require("./resources/UserPool");
const IdentityPool_1 = require("./resources/IdentityPool");
const IdentityPoolRoleAttachment_1 = require("./resources/IdentityPoolRoleAttachment");
const AuthenticatedUserRole_1 = require("./resources/AuthenticatedUserRole");
const AuthenticatedUserPolicy_1 = require("./resources/AuthenticatedUserPolicy");
const UserPoolClient_1 = require("./resources/UserPoolClient");
exports.default = cloudform_1.default({
    Description: 'pass-ninja-cli',
    Parameters: {
        Stage: new cloudform_1.StringParameter({
            Description: 'Deployment environment name',
            AllowedValues: ['development', 'staging', 'production'],
            Default: 'production'
        })
    },
    Resources: {
        UserPool: UserPool_1.UserPool,
        UserPoolClient: UserPoolClient_1.UserPoolClient,
        AuthenticatedUserRole: AuthenticatedUserRole_1.AuthenticatedUserRole,
        AuthenticatedUserPolicy: AuthenticatedUserPolicy_1.AuthenticatedUserPolicy,
        IdentityPool: IdentityPool_1.IdentityPool,
        AuthenticatedRoleAttachment: IdentityPoolRoleAttachment_1.AuthenticatedRoleAttachment
    }
});
//# sourceMappingURL=cloudform.js.map