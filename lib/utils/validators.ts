export const isEmptyString = (obj: any) => obj instanceof String && !obj.length;

export const iString = (obj: any) => obj instanceof String;

export interface NfcKey {
  privateKeyPem: string;
}

export const isNfcKey = (key: any): key is NfcKey => {
  return (
    typeof key === 'object' &&
    key.hasOwnProperty('privateKeyPem') &&
    typeof (key as NfcKey).privateKeyPem === 'string' &&
    !!(key as NfcKey).privateKeyPem.length
  );
};

export interface AppleVasKey extends NfcKey {
  passTypeId: string;
}

export const isAppleVasKey = (key: any): key is AppleVasKey => {
  return (
    isNfcKey(key) &&
    key.hasOwnProperty('passTypeId') &&
    typeof (key as AppleVasKey).passTypeId === 'string' &&
    !!(key as AppleVasKey).passTypeId.length
  );
};

export interface GoogleSmartTapKey extends NfcKey {
  collectorId: number;
  version: number;
}

export const isGoogleSmartTapKey = (key: any): key is GoogleSmartTapKey => {
  return (
    isNfcKey(key) &&
    typeof (key as GoogleSmartTapKey).collectorId === 'number' &&
    typeof (key as GoogleSmartTapKey).version === 'number'
  );
};

export interface NfcKeys {
  appleVAS: {
    keys: AppleVasKey[];
  };
  googleSmartTap: {
    keys: GoogleSmartTapKey[];
  };
}

export const isNfcKeys = (keys: any): keys is NfcKeys => {
  const isValidKeyArray = (keyName: 'googleSmartTap' | 'appleVAS') =>
    keys.hasOwnProperty(keyName) &&
    keys[keyName].hasOwnProperty('keys') &&
    Array.isArray(keys[keyName].keys) &&
    !keys[keyName].keys.filter((key: any) =>
      keyName === 'googleSmartTap'
        ? !isGoogleSmartTapKey(key)
        : !isAppleVasKey(key)
    ).length;

  return (
    typeof keys === 'object' &&
    isValidKeyArray('appleVAS') &&
    isValidKeyArray('googleSmartTap')
  );
};

export const isNfc = (nfc: any) => {
  return isNfcKeys(nfc.keys);
};
