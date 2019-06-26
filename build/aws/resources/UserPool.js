"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudform_1 = require("cloudform");
exports.UserPool = new cloudform_1.Cognito.UserPool({
    UserPoolName: cloudform_1.Fn.Join('-', ['pass-ninja', cloudform_1.Fn.Ref('Stage'), 'user-pool']),
    AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: true,
        UnusedAccountValidityDays: 7
        // InviteMessageTemplate: {
        //   EmailMessage: 'replace me as the body of the invite message',
        //   EmailSubject: 'PassNinja Administrator Account Invitation'
        // }
    },
    EmailConfiguration: {
        ReplyToEmailAddress: 'info@flomio.com'
    },
    DeviceConfiguration: {
        ChallengeRequiredOnNewDevice: false,
        DeviceOnlyRememberedOnUserPrompt: false
    },
    UsernameAttributes: ['email'],
    AutoVerifiedAttributes: ['email'],
    Policies: {
        PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireSymbols: true,
            RequireUppercase: true,
            RequireNumbers: true
        }
    }
});
//# sourceMappingURL=UserPool.js.map