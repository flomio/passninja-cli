export declare interface AwsCredentials {
  data: {
    Credentials: {
      SecretKey: any;
      SessionToken: any;
      AccessKeyId: any;
    };
  };
}

export declare interface PassNinjaCliCredentials {
  secretAccessKey: AwsCredentials["data"]["Credentials"]["SecretKey"];
  sessionToken: AwsCredentials["data"]["Credentials"]["SessionToken"];
  accessKeyId: AwsCredentials["data"]["Credentials"]["AccessKeyId"];
}

export function normalizedCredentials(
  credentials: AwsCredentials
): PassNinjaCliCredentials {
  // NOTE: these credentials could be in different shape depending upon
  // which session service is used. Why doesn't AWS wash over this with the
  // sdk ???
  const { SecretKey, SessionToken, AccessKeyId } = credentials.data.Credentials;

  return {
    secretAccessKey: SecretKey,
    sessionToken: SessionToken,
    accessKeyId: AccessKeyId
  };
}
