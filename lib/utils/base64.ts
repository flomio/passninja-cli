export const toBase64 = (buffer: Buffer) => {
  return buffer.toString('base64');
};

export const fromBase64 = (str: string) => {
  return Buffer.from(str, 'base64');
};
