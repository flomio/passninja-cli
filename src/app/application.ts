
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
var routing_and_configuration_1 = __webpack_require__(/*! ./routing-and-configuration */ \"./src/routing-and-configuration.ts\");
var http_server_1 = __webpack_require__(/*! ./services/http-server */ \"./src/services/http-server.ts\");
var injection_tokens_1 = __webpack_require__(/*! ./injection-tokens */ \"./src/injection-tokens.ts\");
var sign_pass_1 = __webpack_require__(/*! ./commands/sign-pass */ \"./src/commands/sign-pass.ts\");
var logging_1 = __webpack_require__(/*! ./logging */ \"./src/logging.ts\");
var queue_service_1 = __webpack_require__(/*! ./services/queue.service */ \"./src/services/queue.service.ts\");
var pathModule = __importStar(__webpack_require__(/*! path */ \"path\"));
var watch_1 = __webpack_require__(/*! ./utils/watch */ \"./src/utils/watch.ts\");
var sign_gpay_pass_1 = __webpack_require__(/*! ./commands/sign-gpay-pass */ \"./src/commands/sign-gpay-pass.ts\");
var wallet_objects_rpc_1 = __webpack_require__(/*! ./services/wallet-objects-rpc */ \"./src/services/wallet-objects-rpc.ts\");
var readers_service_1 = __webpack_require__(/*! ./services/readers/readers.service */ \"./src/services/readers/readers.service.ts\");
var auth_service_1 = __webpack_require__(/*! ./services/auth/auth.service */ \"./src/services/auth/auth.service.ts\");
var event_bus_1 = __webpack_require__(/*! ./services/event-bus */ \"./src/services/event-bus.ts\");
var iot_service_1 = __webpack_require__(/*! ./services/iot/iot.service */ \"./src/services/iot/iot.service.ts\");
var create_pass_type_1 = __webpack_require__(/*! ./commands/create-pass-type */ \"./src/commands/create-pass-type.ts\");
var Application = /** @class */ (function () {
    function Application(options, queue, events, gpay, iot, injector, readers, auth, routes, http) {
        this.options = options;
        this.queue = queue;
        this.events = events;
        this.gpay = gpay;
        this.iot = iot;
        this.injector = injector;
        this.readers = readers;
        this.auth = auth;
        this.routes = routes;
        this.http = http;
        this.startedHttp = false;
    }
    /**
     * - watch a folder
     *
     */
    Application.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var commands, cons, args, signer_1, path;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // TODO: sub-commands may depend upon this ...
                        this.auth.login().then();
                        if (this.options.subCommand) {
                            commands = {
                                'create-pass-type': create_pass_type_1.CreatePassTypeCommand
                            };
                            cons = this.injector.get(commands[this.options.subCommand.name]);
                            return [2 /*return*/, cons.run(this.options.subCommand)];
                        }
                        args = this.options.args;
                        if (!(args.signPass || args.signBatch)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.runAppleSignPass(args)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        if (!args.signGpayBatch) return [3 /*break*/, 4];
                        if (args.watch) {
                            this.startServer();
                        }
                        signer_1 = this.injector.get(sign_gpay_pass_1.SignGpayPassCommand);
                        logging_1.dbg('Signing pass');
                        return [4 /*yield*/, signer_1.signGPayBatch(args.signGpayBatch)];
                    case 3:
                        _a.sent();
                        if (!args.watch) {
                            process.exit();
                        }
                        else {
                            path = pathModule.dirname(args.signGpayBatch);
                            watch_1.watch(path, (function (changeType, fullPath, currentStat, previousStat) {
                                switch (changeType) {
                                    case 'create':
                                    case 'update':
                                        _this.queue.queue('sign-pass', function () { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, signer_1.signGPayBatch(args.signGpayBatch)];
                                                    case 1:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        break;
                                    case 'delete':
                                        break;
                                }
                            }));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        this.startServer();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Application.prototype.runAppleSignPass = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var signer, sign, path;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args.watch) {
                            this.startServer();
                        }
                        signer = this.injector.get(sign_pass_1.SignPassCommand);
                        logging_1.dbg('Signing pass');
                        sign = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!args.signPass) return [3 /*break*/, 2];
                                        return [4 /*yield*/, signer.signPkPass({
                                                folder: args.signPass
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2:
                                        if (!args.signBatch) return [3 /*break*/, 4];
                                        return [4 /*yield*/, signer.signPkPassBatch({
                                                entryPoint: args.signBatch,
                                                outputPath: args.outputPath
                                            })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, sign()];
                    case 1:
                        _a.sent();
                        logging_1.dbg('Finished!');
                        if (!args.watch) {
                            process.exit();
                        }
                        else {
                            path = args.signPass || pathModule.dirname(args.signBatch);
                            watch_1.watch(path, (function (changeType, fullPath, currentStat, previousStat) {
                                switch (changeType) {
                                    case 'create':
                                    case 'update':
                                        _this.queue.queue('sign-pass', function () { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                return [2 /*return*/, sign()];
                                            });
                                        }); });
                                        break;
                                    case 'delete':
                                        break;
                                }
                            }));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Application.prototype.startServer = function () {
        if (!this.startedHttp) {
            this.startedHttp = true;
            this.http.listen();
            this.readers.start();
        }
    };
    Application = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, queue_service_1.QueueService,
            event_bus_1.EventBus,
            wallet_objects_rpc_1.WalletObjectsRpc,
            iot_service_1.IotService,
            injection_js_1.Injector,
            readers_service_1.ReadersService,
            auth_service_1.AuthService,
            routing_and_configuration_1.RoutingAndConfiguration,
            http_server_1.HttpServer])
    ], Application);
    return Application;
}());
exports.Application = Application;


//# sourceURL=webpack://commonjs/./src/application.ts?"