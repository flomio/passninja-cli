
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError(\"Generator is already executing.\");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var cp = __importStar(__webpack_require__(/*! child_process */ \"child_process\"));
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
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
            logging_1.dbg('signing', { args: JSON.stringify(redacted) });
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