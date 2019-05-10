"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
const Configuration_1 = require("../lib/Configuration");
const AWS = require("aws-sdk");
global.fetch = require('node-fetch');
const { userPoolId, userPoolClientId } = Configuration_1.CONFIG;
const Username = 'matt@flomio.com';
const Password = 'Password123!';
const userPool = new amazon_cognito_identity_js_1.CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: userPoolClientId
});
const user = new amazon_cognito_identity_js_1.CognitoUser({
    Pool: userPool,
    Username
});
const authData = new amazon_cognito_identity_js_1.AuthenticationDetails({
    Username,
    Password
});
user.authenticateUser(authData, {
    onSuccess: result => {
        AWS.config.region = Configuration_1.CONFIG.region;
        let creds = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: Configuration_1.CONFIG.identityPoolId,
            Logins: {
                [Configuration_1.CONFIG.federation]: result.getIdToken().getJwtToken()
            }
        });
        creds
            .refreshPromise()
            .then(res => console.log(creds), err => console.log(err));
        // const creds = new CognitoIdentityCredentials({
        // IdentityPoolId: CONFIG.identityPoolId,
        // Logins: {
        //   [CONFIG.federation]: result.getIdToken().getJwtToken()
        // }
        // });
        // console.log(result);
        // user.getSession((error: Error, session: any) => {
        //   user.refreshSession(
        //     session.getRefreshToken(),
        //     (err: Error, newSession: any) => {
        //       console.log(err, newSession);
        //       console.log(
        //         new CognitoIdentityCredentials({
        //           IdentityPoolId: CONFIG.identityPoolId,
        //           Logins: {
        //             [CONFIG.federation]: session.getIdToken().getJwtToken()
        //           }
        //         })
        //       );
        //     }
        //   );
        // });
    },
    onFailure: err => {
        console.log(err);
    }
    // newPasswordRequired: (userAttributes: any, requiredAttributes: any) => {}
});
// const user = userPool.getCurrentUser();
// if (user != null) {
//   user.getSession((err: Error, result: any) => {
//     if (err) console.error(err);
//     if (result) {
//       console.log(result);
//     }
//   });
// } else {
//   console.error('didnt work');
// }
//# sourceMappingURL=cognitoTest.js.map