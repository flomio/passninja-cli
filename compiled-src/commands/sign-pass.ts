
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
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
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var path = __importStar(__webpack_require__(/*! path */ \"path\"));
var create_pass_1 = __webpack_require__(/*! @passninja/passkit/dist/create-pass */ \"../passkit/dist/create-pass.js\");
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var util_1 = __webpack_require__(/*! util */ \"util\");
var stream_1 = __webpack_require__(/*! stream */ \"stream\");
var store_1 = __webpack_require__(/*! ../services/store */ \"./src/services/store.ts\");
var require_pass_json_1 = __webpack_require__(/*! ../utils/require-pass-json */ \"./src/utils/require-pass-json.ts\");
var manifest_signer_service_1 = __webpack_require__(/*! ../services/signing/manifest-signer.service */ \"./src/services/signing/manifest-signer.service.ts\");
var BufferCollector = /** @class */ (function (_super) {
    __extends(BufferCollector, _super);
    function BufferCollector() {
        var _this = _super.call(this, {
            transform: function (chunk, encoding, callback) {
                _this.buffers.push(chunk);
                return callback(null, chunk);
            }
        }) || this;
        _this.buffers = [];
        _this.finished = new Promise(function (resolve) {
            _this.once('close', resolve);
        });
        return _this;
    }
    BufferCollector.prototype.data = function () {
        return Buffer.concat(this.buffers);
    };
    return BufferCollector;
}(stream_1.Transform));
var SignPassCommand = /** @class */ (function () {
    function SignPassCommand(store, signer) {
        this.store = store;
        this.signer = signer;
    }
    SignPassCommand.prototype.signPkPassBatch = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var entryPoint, folder, passes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entryPoint = parameters.entryPoint;
                        folder = path.dirname(entryPoint);
                        passes = require_pass_json_1.requireClean(entryPoint).appleBatch;
                        return [4 /*yield*/, Promise.all(passes.map(function (_a) {
                                var fn = _a[0], pass = _a[1];
                                return _this.signPkPass({
                                    pass: pass, folder: folder, outputTo: path.join(parameters.outputPath, fn)
                                });
                            }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fully asynchronously signs passes, and saves the latest pass to the state
     * TODO: Should also save the serialized pass.json to serve up, along with
     * the path to the folders ? /latestPass/pass.json /latestPass/background.png?
     * /latestPass/images.json ?
     */
    SignPassCommand.prototype.signPkPass = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var folder, _a, outputTo, _b, pass, outputStream, collector, outputClosed, files, images, signer;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        folder = parameters.folder, _a = parameters.outputTo, outputTo = _a === void 0 ? 'pass.pkpass' : _a, _b = parameters.pass, pass = _b === void 0 ? require_pass_json_1.requireApplePass(parameters.folder) : _b;
                        outputStream = fs.createWriteStream(outputTo);
                        collector = new BufferCollector();
                        collector.pipe(outputStream);
                        collector.on('end', function () {
                            logging_1.dbg('collector close');
                        });
                        outputClosed = new Promise(function (resolve) {
                            outputStream.on('close', function () {
                                logging_1.dbg('output stream close');
                                resolve();
                            });
                        });
                        return [4 /*yield*/, util_1.promisify(fs.readdir)(folder)];
                    case 1:
                        files = _c.sent();
                        logging_1.dbg('signing pass', pass.passTypeIdentifier, pass.serialNumber);
                        images = files.filter(function (fn) { return fn.endsWith('.png'); })
                            .map(function (fn) { return path.join(folder, fn); });
                        signer = function (buf) {
                            return _this.signer.sign(pass.passTypeIdentifier, buf);
                        };
                        return [4 /*yield*/, create_pass_1.createPass({
                                pass: pass,
                                signer: signer,
                                outputStream: collector,
                                filePaths: images
                            })];
                    case 2:
                        _c.sent();
                        logging_1.trc('awaited createPass');
                        return [4 /*yield*/, outputClosed];
                    case 3:
                        _c.sent();
                        logging_1.trc('output closed');
                        this.store.latestPkPass.next(collector.data());
                        return [2 /*return*/];
                }
            });
        });
    };
    SignPassCommand = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [store_1.StateStoreService,
            manifest_signer_service_1.ManifestSignerService])
    ], SignPassCommand);
    return SignPassCommand;
}());
exports.SignPassCommand = SignPassCommand;


//# sourceURL=webpack://commonjs/./src/commands/sign-pass.ts?"