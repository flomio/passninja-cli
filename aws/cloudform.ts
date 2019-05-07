import { default as CF, StringParameter } from 'cloudform';

import { UserPool } from './resources/UserPool';
import { UserPoolClient } from './resources/UserPoolClient';
import { IdentityPool } from './resources/IdentityPool';
import { IdentityPoolRoleAttachment } from './resources/IdentityPoolRoleAttachment';
import { UnAuthenticatedUserRole } from './resources/UnAuthenticatedUserRole';
import { AuthenticatedUserRole } from './resources/AuthenticatedUserRole';
import { AuthenticatedUserPolicy } from './resources/AuthenticatedUserPolicy';

export default CF({
  Description: 'pass-ninja-iam',
  Parameters: {
    Stage: new StringParameter({
      Description: 'Deployment environment name',
      AllowedValues: ['development', 'staging', 'production'],
      Default: 'development'
    })
  },
  Resources: {
    UserPool,
    UserPoolClient,
    IdentityPool,
    IdentityPoolRoleAttachment,
    UnAuthenticatedUserRole,
    AuthenticatedUserRole,
    AuthenticatedUserPolicy
  }
});
