// TODO: These were the variable passed in the webpack config

// /* WEBPACK VAR INJECTION */(function(module) {
// Object.defineProperty(exports, \"__esModule\", { value: true });
// {
//     process.env.DEBUG = process.env.PN_DEBUG || 'pn';
//     process.noDeprecation = true;
// }

export const GOOGLE_APPLICATION_CREDENTIALS =
  process.env.GOOGLE_APPLICATION_CREDENTIALS;
export const PASSNINJA_APPLE_SERVICE_ACCOUNT_PASS_WORD = process.env.APPLE_PASS;
export const CLOUD_SESSION_URL = process.env.CLOUD_SESSION_URL;
export const BACKEND_URL = process.env.BACKEND_URL;
export const PN_NFC_KEYS = process.env.PN_NFC_KEYS;
