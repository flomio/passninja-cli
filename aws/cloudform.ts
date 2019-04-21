import {
  default as CF,
  Fn,
  Refs,
  EC2,
  StringParameter,
  ResourceTag
} from 'cloudform'

import { UserPool } from './UserPool'
import { IdentityPool } from './IdentityPool'
import { UserPoolClientPnCli } from './UserPoolClient.pn-cli'

export const cloudform = CF({
  Description: 'PassNinja',
  Parameters: {
    Stage: new StringParameter({
      Description: 'Deployment environment name',
      AllowedValues: ['dev', 'stage', 'prod']
    })
  },
  Resources: {
    UserPool,
    IdentityPool,
    UserPoolClientPnCli
  }
})
