import { CognitoIdentityServiceProvider } from 'aws-sdk'

const provider = new CognitoIdentityServiceProvider({
  region: 'us-east-1'
})

const change = async () => {
  const ClientId = '31rageklk93ge7k82e4it9jmp4'

  try {
    let response: any = await provider
      .initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId,
        AuthParameters: {
          USERNAME: 'matt@flomio.com',
          PASSWORD: 'PassWord123!'
        }
      })
      .promise()

    console.log(response)

    const { Session } = response

    response = await provider
      .respondToAuthChallenge({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ClientId,
        Session,
        ChallengeResponses: {
          USERNAME: 'matt@flomio.com',
          NEW_PASSWORD: 'Password123!'
        }
      })
      .promise()

    console.log(response)
  } catch (err) {
    console.error(`>>>ERROR>>> ${err}`)
  }
}

change()
