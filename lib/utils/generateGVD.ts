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
