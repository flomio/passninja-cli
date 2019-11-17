import * as fs from 'fs';
import * as path from 'path';
import { NfcKeys } from './validators';

export const getNfc = (pathToKeys: string) => {
    // pass in key string for future support for lambda based get on registration
    if (fs.existsSync(pathToKeys)) {
        const keys = JSON.parse(fs.readFileSync(pathToKeys).toString()) as NfcKeys;
        return {
            selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
            selectCollectorId: 77501435,
            keys
        };
    }
    throw new Error('No NFC keys were found');
};

export const getBaseConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    const region = process.env.REGION || '';
    const pathToKeys = path.resolve(__dirname, 'pn-nfc-keys.json');

    return {
        region,
        stack: `pass-ninja-${env}`,
        userPoolId: process.env.USER_POOL_ID || '',
        userPoolClientId: process.env.USER_POOL_CLIENT_ID || '',
        identityPoolId: process.env.IDENTITY_POOL_ID || '',
        federation: process.env.FEDERATION || '',
        iotHost: `${process.env.IOT_HOST}.iot.${region}.amazonaws.com`,
        nfc: getNfc(pathToKeys)
    };
};