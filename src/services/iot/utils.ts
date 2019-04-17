
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { \"default\": mod };
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var os = __importStar(__webpack_require__(/*! os */ \"os\"));
var crypto = __importStar(__webpack_require__(/*! crypto */ \"crypto\"));
var forge = __importStar(__webpack_require__(/*! node-forge */ \"./node_modules/node-forge/lib/index.js\"));
var base_x_1 = __importDefault(__webpack_require__(/*! base-x */ \"./node_modules/base-x/index.js\"));
function generateCSR(identityId) {
    \"\
  # Generate the certificate signing request, with encrypted private key, getting\
  # the password from file 'arst'\
  openssl req -x509 -newkey rsa:2048 -keyout encrypted-key.pem -out cert-request.pem -days 365 -subj /CN=PEM/ -passout 'file:arst'\
  # Upload to signing request to apple\
  client.x(...)\
  # Download the certificate in DER from Apple to pass.id.cer\
  client.y(...)\
  # Output the certificate in PEM form from DER form as downloaded from Apple site\
  openssl x509 -in pass.id.cer -inform DER -outform PEM -out cert.pem\
  # Concatenate cert PEM and encrypted private key PEM \
  cat cert.pem > bundle.pem\
  cat encrypted-key >> bundle.pem \";
    //
    var keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    var csr = forge.pki.createCertificationRequest();
    csr.publicKey = keypair.publicKey;
    csr.setSubject([{
            name: 'organizationName',
            value: identityId
        }]);
    csr.sign(keypair.privateKey, forge.md.sha256.create());
    return {
        csr: forge.pki.certificationRequestToPem(csr),
        // @ts-ignore
        key: forge.pki.privateKeyToPem(keypair.privateKey)
    };
}
exports.generateCSR = generateCSR;
var alphabet = base_x_1.default('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:_-');
function hash(val) {
    var sha = crypto.createHash('sha256').update(val);
    return alphabet.encode(sha.digest());
}
/**
 * This is used in AWS thing names which have a maximum length allowed of
 * 128 using chars matching /[a-zA-Z0-9:-_]/
 *
 * We use a custom base64 encoding using BaseX
 *
 */
function machineId(extraMaterial) {
    var machineIdString = '';
    // mac addresses
    var interfaces = os.networkInterfaces();
    var interfaceNames = Object.keys(interfaces);
    var macAddresses = new Set();
    for (var _i = 0, interfaceNames_1 = interfaceNames; _i < interfaceNames_1.length; _i++) {
        var interfaceName = interfaceNames_1[_i];
        for (var _a = 0, _b = interfaces[interfaceName]; _a < _b.length; _a++) {
            var iface = _b[_a];
            macAddresses.add(iface.mac);
        }
    }
    machineIdString += new Array(macAddresses.values()).sort().join('/') + '|';
    // memory
    machineIdString += os.totalmem() + '|';
    // cpu info
    var cpuInfo = os.cpus();
    machineIdString += cpuInfo[0].model + '/' + cpuInfo.length;
    machineIdString += '|' + extraMaterial;
    return hash(machineIdString);
}
exports.machineId = machineId;


//# sourceURL=webpack://commonjs/./src/services/iot/utils.ts?"