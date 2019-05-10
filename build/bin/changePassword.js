"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const aws_sdk_1 = require("aws-sdk");
const provider = new aws_sdk_1.CognitoIdentityServiceProvider({
    region: 'us-east-1'
});
const change = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const ClientId = '31rageklk93ge7k82e4it9jmp4';
    try {
        let response = yield provider
            .initiateAuth({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId,
            AuthParameters: {
                USERNAME: 'matt@flomio.com',
                PASSWORD: 'PassWord123!'
            }
        })
            .promise();
        console.log(response);
        const { Session } = response;
        response = yield provider
            .respondToAuthChallenge({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId,
            Session,
            ChallengeResponses: {
                USERNAME: 'matt@flomio.com',
                NEW_PASSWORD: 'Password123!'
            }
        })
            .promise();
        console.log(response);
    }
    catch (err) {
        console.error(`>>>ERROR>>> ${err}`);
    }
});
change();
//# sourceMappingURL=changePassword.js.map