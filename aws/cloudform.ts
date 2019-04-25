import { default as CF, StringParameter } from 'cloudform'

import { UserPool } from './resources/UserPool'
import { IdentityPool } from './resources/IdentityPool'
import { AuthenticatedRoleAttachment } from './resources/IdentityPoolRoleAttachment'
import { AuthenticatedUserRole } from './resources/AuthenticatedUserRole'
import { AuthenticatedUserPolicy } from './resources/AuthenticatedUserPolicy'
import { UserPoolClient } from './resources/UserPoolClient'

export default CF({
  Description: 'pass-ninja-cli',
  Parameters: {
    Stage: new StringParameter({
      Description: 'Deployment environment name',
      AllowedValues: ['development', 'staging', 'production'],
      Default: 'production'
    })
  },
  Resources: {
    UserPool,
    UserPoolClient,
    AuthenticatedUserRole,
    AuthenticatedUserPolicy,
    IdentityPool,
    AuthenticatedRoleAttachment
  }
})
