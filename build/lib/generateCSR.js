"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forge = require("node-forge");
exports.generateCSR = (identityId) => {
    //   \"\
    // # Generate the certificate signing request, with encrypted private key, getting\
    // # the password from file 'arst'\
    // openssl req -x509 -newkey rsa:2048 -keyout encrypted-key.pem -out cert-request.pem -days 365 -subj /CN=PEM/ -passout 'file:arst'\
    // # Upload to signing request to apple\
    // client.x(...)\
    // # Download the certificate in DER from Apple to pass.id.cer\
    // client.y(...)\
    // # Output the certificate in PEM form from DER form as downloaded from Apple site\
    // openssl x509 -in pass.id.cer -inform DER -outform PEM -out cert.pem\
    // # Concatenate cert PEM and encrypted private key PEM \
    // cat cert.pem > bundle.pem\
    // cat encrypted-key >> bundle.pem \";
    //
    const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keyPair.publicKey;
    csr.setSubject([
        {
            name: 'organizationName',
            value: identityId
        }
    ]);
    csr.sign(keyPair.privateKey, forge.md.sha256.create());
    return {
        csr: forge.pki.certificationRequestToPem(csr),
        key: forge.pki.privateKeyToPem(keyPair.privateKey)
    };
};
//# sourceMappingURL=generateCSR.js.map