import { AuthorizationService } from '../no_compile/AuthorizationService'
import { config } from './config'

describe('AuthorizationService', () => {
  it('To exist', () => {
    expect(!!AuthorizationService).toBeTruthy()
  })

  it('should login', done => {
    const authService = new AuthorizationService(config)

    authService.$credentials.subscribe(
      creds => console.log(creds),
      err => console.error(err)
    )
  })
})
