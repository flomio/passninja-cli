import { LocalCertsService } from '../certs/local-certs.service';
import { signManifest } from '../signing/sign-manifest';

export class LocalManifestSigner {
  constructor(public options: any, public certs: LocalCertsService) {}

  sign = (passTypeIdentifier, buffer) => {
    var conf;
    conf = this.certs.getPKPassCertSigningConfig(passTypeIdentifier);
    return signManifest(
      buffer,
      conf.passPhrase,
      conf.certPath,
      this.certs.certPath('wwdr.pem')
    );
  };
}
