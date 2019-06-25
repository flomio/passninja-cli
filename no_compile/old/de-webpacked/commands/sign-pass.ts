Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var path = __importStar(__webpack_require__(/*! path */ \"path\"));
var create_pass_1 = __webpack_require__(/*! @passninja/passkit/dist/create-pass */ \"../passninja-passkit/dist/create-pass.js\");
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var util_1 = __webpack_require__(/*! util */ \"util\");
var stream_1 = __webpack_require__(/*! stream */ \"stream\");
var store_1 = __webpack_require__(/*! ../services/store */ \"./src/services/store.ts\");
var require_pass_json_1 = __webpack_require__(/*! ../utils/require-pass-json */ \"./src/utils/require-pass-json.ts\");
var manifest_signer_service_1 = __webpack_require__(/*! ../services/signing/manifest-signer.service */ \"./src/services/signing/manifest-signer.service.ts\");
var passkit_web_protocol_service_1 = __webpack_require__(/*! ../http-handlers/apple-passkit-service/db/passkit-web-protocol.service */ \"./src/http-handlers/apple-passkit-service/db/passkit-web-protocol.service.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../injection-tokens */ \"./src/injection-tokens.ts\");
var crypto_1 = __webpack_require__(/*! crypto */ \"crypto\");

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
    function SignPassCommand(config, service, store, signer) {
        this.config = config;
        this.service = service;
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
            var folder, _a, outputTo, _b, pass, webServiceURL, outputStream, collector, outputClosed, files, filePaths, signer, value;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        folder = parameters.folder, _a = parameters.outputTo, outputTo = _a === void 0 ? 'pass.pkpass' : _a, _b = parameters.pass, pass = _b === void 0 ? require_pass_json_1.requireApplePass(parameters.folder) : _b;
                        if (!this.config.args.passkitService) return [3 /*break*/, 3];
                        logging_1.dbg('Waiting for Passkit service');
                        return [4 /*yield*/, this.service.initLazy()];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, this.service.ngrokUrl];
                    case 2:
                        webServiceURL = (_c.sent()) + '/passkit-service';
                        logging_1.dbg('Using', { webServiceURL: webServiceURL });
                        pass.webServiceURL = webServiceURL;
                        pass.authenticationToken = crypto_1.randomBytes(10).toString('base64');
                        _c.label = 3;
                    case 3:
                        logging_1.dbg({ folder: folder, outputTo: outputTo });
                        outputStream = fs.createWriteStream(outputTo);
                        collector = new BufferCollector();
                        collector.pipe(outputStream);
                        collector.on('end', function () {
                            logging_1.trc('Collector close');
                        });
                        outputClosed = new Promise(function (resolve) {
                            outputStream.on('close', function () {
                                logging_1.trc('Output stream close');
                                resolve();
                            });
                        });
                        return [4 /*yield*/, util_1.promisify(fs.readdir)(folder)];
                    case 4:
                        files = _c.sent();
                        logging_1.dbg('Signing pass', pass.passTypeIdentifier, pass.serialNumber);
                        filePaths = files
                            .filter(function (fn) { return !((fn.endsWith('.ts')) ||
                            (fn === 'signature') ||
                            (fn === 'manifest.json') ||
                            (fn === 'images.json')); })
                            .map(function (fn) { return path.join(folder, fn); })
                            .filter(function (fn) { return !fs.statSync(fn).isDirectory(); });
                        signer = function (buf) {
                            return _this.signer.sign(pass.passTypeIdentifier, buf);
                        };
                        return [4 /*yield*/, create_pass_1.createPass({
                                pass: pass,
                                signer: signer,
                                outputStream: collector,
                                filePaths: filePaths
                            })];
                    case 5:
                        _c.sent();
                        logging_1.trc('Awaited createPass');
                        return [4 /*yield*/, outputClosed];
                    case 6:
                        _c.sent();
                        logging_1.trc('Output closed');
                        value = collector.data();
                        this.store.setPass(pass, value);
                        this.service.notifyUpdate(pass);
                        return [2 /*return*/];
                }
            });
        });
    };
    SignPassCommand = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, passkit_web_protocol_service_1.PasskitWebProtocolService,
            store_1.StateStoreService,
            manifest_signer_service_1.ManifestSignerService])
    ], SignPassCommand);
    return SignPassCommand;
}());
exports.SignPassCommand = SignPassCommand;


//# sourceURL=webpack://commonjs/./src/commands/sign-pass.ts?"
