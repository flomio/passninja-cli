import * as os from "os"
import * as crypto from "crypto"
import * as forge from "forge"
import * as baseX from "base-x"

export const generateCSR = identityId => {
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
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 })
  const csr = forge.pki.createCertificationRequest()

  csr.publicKey = keyPair.publicKey

  csr.setSubject([
    {
      name: "organizationName",
      value: identityId
    }
  ])

  csr.sign(keyPair.privateKey, forge.md.sha256.create())

  return {
    csr: forge.pki.certificationRequestToPem(csr),
    key: forge.pki.privateKeyToPem(keyPair.privateKey)
  }
}

const alphabet = baseX(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:_-"
)

function hash(val: string | Buffer) {
  const sha = crypto.createHash("sha256").update(val)
  return alphabet.encode(sha.digest())
}
/**
 * This is used in AWS thing names which have a maximum length allowed of
 * 128 using chars matching /[a-zA-Z0-9:-_]/
 *
 * We use a custom base64 encoding using BaseX
 *
 */
export const machineId = extraMaterial => {
  // mac addresses
  const interfaces = os.networkInterfaces()
  const macAddresses = new Set()

  for (const name in interfaces) {
    if (name) {
      interfaces[name].map(iface => macAddresses.add(iface.mac))
    }
  }

  let machineIdString = ""

  machineIdString += new Array(macAddresses.values()).sort().join("/") + "|"
  // memory
  machineIdString += os.totalmem() + "|"
  // cpu info
  const cpuInfo = os.cpus()

  machineIdString += cpuInfo[0].model + "/" + cpuInfo.length

  machineIdString += "|" + extraMaterial

  return hash(machineIdString)
}
