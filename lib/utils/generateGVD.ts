import * as crypto from 'crypto';

function createSha256(data: string) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest()
    .toString('hex')
    .toUpperCase();
}

export function generateGVD(passTypeId: string) {
  return (
    '80CA0101369F220201009F2520' +
    createSha256(passTypeId) +
    '9F2804C' +
    '5266B6E9F260400000002'
  );
}
