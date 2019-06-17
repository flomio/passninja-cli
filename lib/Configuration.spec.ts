import { Configuration, getNfc, isNfc } from './Configuration';
import * as path from 'path';

describe('nfc keys', () => {
  const pathToKeys = path.resolve(__dirname, 'pn-nfc-keys.json');

  it('getNfcKeys should not throw when reading file', function() {
    expect(() => getNfc(pathToKeys)).not.toThrow();
  });

  it('should return properly formed keys', () => {
    expect(isNfc(getNfc(pathToKeys))).toEqual(true);
  });
});

describe('Configuration', function() {
  it('should build without throwing errors', () => {
    expect(() => new Configuration()).not.toThrow()
  })
});
