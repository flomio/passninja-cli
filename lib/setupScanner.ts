import { Commander } from 'bin/pn'

import { AuthorizationService } from './AuthorizationService'

import { config } from './config'

export const setupScanner = async (program: Commander) => {
  // if (!program.user) {
  //   console.error('please enter your username to setup reader')
  //   process.exit(1)
  // }

  // if (!program.password) {
  //   console.error('please enter your password to setup reader')
  //   process.exit(1)
  // }

  console.log('attempting to login')

  const authService = new AuthorizationService(config)

  authService.$credentials.subscribe(
    creds => console.log(creds),
    err => console.error(err)
  )
}
