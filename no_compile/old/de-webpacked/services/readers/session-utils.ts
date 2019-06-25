export const fromBase64 = (str: string) => {
  return Buffer.from(str, 'base64');
};

export const toBase64 = (buffer: Buffer) => {
  return buffer.toString('base64');
};

// Matt: can't find refrences to use of apduRespB64.
// cannot strongly type
// export const apduRespB64 = resp => {
//   return resp.full.toString("base64")
// }
