import * as path from "path"
import { Inject, Injectable } from "@angular/core"
import { CONFIG_TOKEN } from "src/app/injection-tokens"

@Injectable()
export class LocalCertsService {
  constructor(@Inject(CONFIG_TOKEN) private config: any) {}

  getPKPassCertSigningConfig = function(passTypeIdentifier) {
    const env =
      passTypeIdentifier.toUpperCase().replace(/\\./g, "_") + "_PASSPHRASE"
    // TODO: add to the secrets manager
    // Perhaps some providers to access keys from various locations
    const passPhrase = process.env[env]

    if (!passPhrase) {
      throw new Error("Need to set " + env + " value")
    }

    const name = passTypeIdentifier.replace(/^pass\\./, "") + ".pem"

    return { passPhrase, certPath: this.certPath(name) }
  }

  certPath = name => path.join(this.config.args.certsPath, name)
}
