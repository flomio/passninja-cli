import * as Request from 'request-promise-native';

import { dbg } from '../../logging';

export class RemoteManifestSigner {
  constructor(private _options: any) {}

  sign = async (passTypeIdentifier, buffer) => {
    dbg('Signing pass with', passTypeIdentifier);
    const url =
      this._options.demoBackend.baseUrl + '/public/demo/sign-manifest';

    const resp = await Request(url, {
      resolveWithFullResponse: false,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        passTypeIdentifier: passTypeIdentifier,
        manifestJson: buffer.toString('base64')
      })
    });

    return Buffer.from(JSON.parse(resp).signature, 'base64');
  };
}
