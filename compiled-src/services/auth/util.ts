
Object.defineProperty(exports, \"__esModule\", { value: true });
function normalizedCredentials(creds) {
    // NOTE: these credentials could be in different shape depending upon
    // which session service is used. Why doesn't AWS wash over this with the
    // sdk ???
    var credentials = creds.data.Credentials;
    return {
        secretAccessKey: credentials.SecretKey,
        sessionToken: credentials.SessionToken,
        accessKeyId: credentials.AccessKeyId
    };
}
exports.normalizedCredentials = normalizedCredentials;


//# sourceURL=webpack://commonjs/./src/services/auth/util.ts?"