import * as crypto from 'crypto';

function createSha256(data: string) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest()
    .toString('hex')
    .toUpperCase();
}

export function generateGVD(passTypeIdentifier: string) {
  return (
    '80CA0101369F220201009F2520' +
    createSha256(passTypeIdentifier) +
    '9F2804C' +
    '5266B6E9F260400000002'
  );
}

export const toBase64 = (buffer: Buffer) => {
  return buffer.toString('base64');
};

export const fromBase64 = (str: string) => {
  return Buffer.from(str, 'base64');
};

export const enum CommandKey {
  select_ose,
  negotiate_session,
  get_smart_tap_data,
  get_more_smart_tap_data,
  received_response,
  send_apdu,
  got_data,
  get_data,
  un_power,
  decrypt_smart_tap_data,
  decrypted_smart_tap_data,
  get_vas_data,
  decrypt_vas_data,
  decrypted_vas_data
}
