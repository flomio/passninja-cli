import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js'

import { CONFIG } from '../lib/Configuration'
import * as AWS from 'aws-sdk'

(global as any).fetch = require('node-fetch')

const { userPoolId, userPoolClientId } = CONFIG
const Username = 'matt@flomio.com'
const Password = 'Password123!'

const userPool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: userPoolClientId
})

const user = new CognitoUser({
  Pool: userPool,
  Username
})

const authData = new AuthenticationDetails({
  Username,
  Password
})

user.authenticateUser(authData, {
  onSuccess: result => {
    AWS.config.region = CONFIG.region

    const creds = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: CONFIG.identityPoolId,
      Logins: {
        [CONFIG.federation]: result.getIdToken().getJwtToken()
      }
    })

    creds
      .refreshPromise()
      .then(res => console.log(creds), err => console.log(err))
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
    console.log(err)
  }
  // newPasswordRequired: (userAttributes: any, requiredAttributes: any) => {}
})

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
