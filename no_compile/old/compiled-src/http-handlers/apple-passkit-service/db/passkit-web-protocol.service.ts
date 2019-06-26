
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
var typeorm_1 = __webpack_require__(/*! typeorm */ \"./node_modules/typeorm/index.js\");
var os = __importStar(__webpack_require__(/*! os */ \"os\"));
var pathMod = __importStar(__webpack_require__(/*! path */ \"path\"));
var models_1 = __webpack_require__(/*! ./models */ \"./src/http-handlers/apple-passkit-service/db/models.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../../../injection-tokens */ \"./src/injection-tokens.ts\");
var logging_1 = __webpack_require__(/*! ../../../logging */ \"./src/logging.ts\");
var apn_1 = __webpack_require__(/*! @passninja/passkit/dist/apn */ \"../passninja-passkit/dist/apn.js\");
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var local_certs_service_1 = __webpack_require__(/*! ../../../services/certs/local-certs.service */ \"./src/services/certs/local-certs.service.ts\");
function configDir() {
    return pathMod.join(os.homedir(), '.pn');
}
var PasskitWebProtocolService = /** @class */ (function () {
    function PasskitWebProtocolService(config, certs) {
        this.config = config;
        this.certs = certs;
        this._init = false;
    }
    PasskitWebProtocolService.prototype.initLazy = function () {
        if (this._init) {
            return this.ready;
        }
        else {
            this._init = true;
        }
        // TODO:
        this.ngrokUrl =
            Promise.resolve(process.env.NGROK_URL);
        //   ngrok.connect({
        //     region: 'ap',
        //     addr: config.server.port
        // })
        this.connection = typeorm_1.createConnection({
            logging: 'all',
            database: pathMod.join(configDir(), 'passkit.db'),
            synchronize: true,
            type: 'sqlite',
            entities: [
                models_1.DeviceRegistration,
                models_1.Device,
                models_1.Pass
            ]
        });
        return this.ready = Promise.all([this.connection, this.ngrokUrl]);
    };
    PasskitWebProtocolService.prototype.deviceRegistrations = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, registrations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection];
                    case 1:
                        connection = _a.sent();
                        registrations = connection.getRepository(models_1.DeviceRegistration);
                        return [2 /*return*/, registrations.createQueryBuilder('reg')
                                .leftJoin('reg.device', 'device')
                                .where('reg.passTypeIdentifier = :passTypeIdentifier')
                                .andWhere('device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
                                .setParameters(params)
                                .getRawMany().then(function (registrations) {
                                console.log('registrations', registrations);
                                return {
                                    lastUpdated: new Date().toUTCString(),
                                    serialNumbers: registrations.map(function (r) {
                                        return r.reg_passSerialNumber;
                                    })
                                };
                            })];
                }
            });
        });
    };
    PasskitWebProtocolService.prototype.unregisterDevice = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, registrations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection];
                    case 1:
                        connection = _a.sent();
                        registrations = connection.getRepository(models_1.DeviceRegistration);
                        this.registrationQuery(registrations)
                            .setParameters(params)
                            .delete();
                        return [2 /*return*/];
                }
            });
        });
    };
    PasskitWebProtocolService.prototype.registrationQuery = function (registrations) {
        return registrations
            .createQueryBuilder('reg')
            .leftJoin('reg.device', 'device')
            .leftJoin('reg.pass', 'pass')
            .where('device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
            .andWhere('pass.serialNumber = :serialNumber')
            .andWhere('pass.passTypeIdentifier = :passTypeIdentifier');
    };
    PasskitWebProtocolService.prototype.registerDevice = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, registrations, devices, passes, registered, deviceParams, passParams, device, pass, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.connection];
                    case 1:
                        connection = _d.sent();
                        registrations = connection.getRepository(models_1.DeviceRegistration);
                        devices = connection.getRepository(models_1.Device);
                        passes = connection.getRepository(models_1.Pass);
                        return [4 /*yield*/, this.registrationQuery(registrations)
                                // TODO: is this same as above?
                                /*registrations
                                 .createQueryBuilder('reg')
                                 .leftJoin('reg.device', 'device')
                                 .leftJoin('reg.pass', 'pass')
                                 .where(
                                   'device.deviceLibraryIdentifier = :deviceLibraryIdentifier')
                                 .andWhere('pass.serialNumber = :serialNumber')
                                 .andWhere('pass.passTypeIdentifier = :passTypeIdentifier')*/
                                .setParameters(params)
                                .getOne()];
                    case 2:
                        registered = _d.sent();
                        if (!registered) return [3 /*break*/, 3];
                        return [2 /*return*/, 200];
                    case 3:
                        deviceParams = {
                            deviceLibraryIdentifier: params.deviceLibraryIdentifier
                        };
                        passParams = {
                            passTypeIdentifier: params.passTypeIdentifier,
                            serialNumber: params.serialNumber
                        };
                        logging_1.dbg('saving device', deviceParams);
                        logging_1.dbg('saving pass', passParams);
                        device = devices.save(deviceParams);
                        pass = passes.save(passParams);
                        _b = (_a = registrations).save;
                        _c = {
                            pushToken: params.pushToken
                        };
                        return [4 /*yield*/, device];
                    case 4:
                        _c.device = _d.sent();
                        return [4 /*yield*/, pass];
                    case 5: return [4 /*yield*/, _b.apply(_a, [(_c.pass = _d.sent(),
                                _c)])];
                    case 6:
                        _d.sent();
                        return [2 /*return*/, 201];
                }
            });
        });
    };
    PasskitWebProtocolService.prototype.notifyUpdate = function (pass) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, registrations, many, tokens, conf, apn_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection];
                    case 1:
                        connection = _a.sent();
                        registrations = connection.getRepository(models_1.DeviceRegistration);
                        return [4 /*yield*/, registrations.createQueryBuilder('reg')
                                .select('distinct reg.pushToken')
                                .leftJoin('reg.pass', 'pass')
                                .where('pass.serialNumber = :serialNumber')
                                .where('pass.passTypeIdentifier = :passTypeIdentifier ')
                                .setParameters({
                                passTypeIdentifier: pass.passTypeIdentifier,
                                serialNumber: pass.serialNumber
                            })
                                .getRawMany()];
                    case 2:
                        many = _a.sent();
                        tokens = many.map(function (ea) {
                            return ea.pushToken;
                        });
                        logging_1.dbg('Found update tokens: ', tokens);
                        if (this.config.args.certsPath) {
                            conf = this.certs.getPKPassCertSigningConfig(pass.passTypeIdentifier);
                            apn_2 = new apn_1.ApnNotifier(fs.readFileSync(conf.certPath), conf.passPhrase);
                            tokens.forEach(function (t) {
                                return apn_2.pushUpdates(t);
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PasskitWebProtocolService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, local_certs_service_1.LocalCertsService])
    ], PasskitWebProtocolService);
    return PasskitWebProtocolService;
}());
exports.PasskitWebProtocolService = PasskitWebProtocolService;


//# sourceURL=webpack://commonjs/./src/http-handlers/apple-passkit-service/db/passkit-web-protocol.service.ts?"