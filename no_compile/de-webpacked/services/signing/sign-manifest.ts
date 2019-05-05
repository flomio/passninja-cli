
Object.defineProperty(exports, \"__esModule\", { value: true });
var cp = __importStar(__webpack_require__(/*! child_process */ \"child_process\"));
var crypto = __importStar(__webpack_require__(/*! crypto */ \"crypto\"));
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));

function signManifestNode(encodedManifest, passPhrase, privateKeyPemPath, wwdrPemPath) {
    return __awaiter(this, void 0, void 0, function () {
        var signer, chained, buffer;
        return __generator(this, function (_a) {


          signer = crypto.createSign('RSA-SHA256');
            signer.update(encodedManifest);
            chained = fs.readFileSync(privateKeyPemPath) + \"\
\" + fs.readFileSync(wwdrPemPath);
            buffer = signer.sign({
                key: chained,
                passphrase: passPhrase
            });
            return [2 /*return*/, buffer];
        });
    });
}
exports.signManifestNode = signManifestNode;

function signManifest(encodedManifest, passPhrase, privateKeyPemPath, wwdrPemPath) {
    return __awaiter(this, void 0, void 0, function () {
        var passIn, args, redacted, ssl, stdout, stderr;
        return __generator(this, function (_a) {
            passIn = 'pass:' + passPhrase;
            args = [
                'smime',
                '-sign',
                '-binary',
                '-signer',
                privateKeyPemPath,
                // TODO
                '-passin',
                passIn,
                '-certfile',
                wwdrPemPath,
                '-outform',
                'DER'
            ];
            redacted = args.map(function (arg) { return arg === passIn ? '*********' : arg; });
            logging_1.dbg('Signing', { args: JSON.stringify(redacted) });
            ssl = cp.spawn('openssl', args);
            stdout = [];
            stderr = [];
            ssl.stdin.write(encodedManifest);
            ssl.stdout.on('data', function (buf) {
                stdout.push(buf);
            });
            ssl.stderr.on('data', function (buf) {
                stderr.push(buf);
            });
            ssl.stdin.end();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    ssl.once('exit', function (code) {
                        if (code !== 0) {
                            var err = Buffer.concat(stderr).toString();
                            reject(new Error(\"openssl exited with code: \" + code + \" \" + err));
                        }
                        else {
                            resolve(Buffer.concat(stdout));
                        }
                    });
                })];
        });
    });
}
exports.signManifest = signManifest;


//# sourceURL=webpack://commonjs/./src/services/signing/sign-manifest.ts?"
