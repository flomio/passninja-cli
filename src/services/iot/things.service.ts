
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var auth_service_1 = __webpack_require__(/*! ../auth/auth.service */ \"./src/services/auth/auth.service.ts\");
var event_bus_1 = __webpack_require__(/*! ../event-bus */ \"./src/services/event-bus.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var AWS = __importStar(__webpack_require__(/*! aws-sdk */ \"./node_modules/aws-sdk/lib/aws.js\"));
var mqtt = __importStar(__webpack_require__(/*! mqtt */ \"./node_modules/mqtt/mqtt.js\"));
var os = __importStar(__webpack_require__(/*! os */ \"os\"));
var path = __importStar(__webpack_require__(/*! path */ \"path\"));
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var util = __importStar(__webpack_require__(/*! util */ \"util\"));
var _ = __importStar(__webpack_require__(/*! lodash */ \"./node_modules/lodash/lodash.js\"));
var utils_1 = __webpack_require__(/*! ./utils */ \"./src/services/iot/utils.ts\");
var util_1 = __webpack_require__(/*! util */ \"util\");
var ThingsService = /** @class */ (function () {
    function ThingsService(options, events, auth) {
        this.options = options;
        this.events = events;
        this.auth = auth;
    }
    /**
     * TODOD: Make 'recoverable' sequence.
     * Check if thing exists, has one prinicipal attached, that that principal
     * ... yada yada yada
     *
     * @param name
     */
    ThingsService.prototype.tryRegisterThing = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var creds, iot, thingName, e_1, thing, certRequest, privateKey, cert, attached, thingPrincipal, certificatePem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.auth.waitCredentials()];
                    case 1:
                        creds = _a.sent();
                        iot = new AWS.Iot({
                            region: this.options.awsResources.region,
                            credentials: creds
                        });
                        thingName = this.getThingName(creds, name);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, iot.describeThing({ thingName: thingName }).promise()];
                    case 3:
                        _a.sent();
                        if (!process.env.FORCE_THING_CONF_RECREATE) {
                            logging_1.dbg('Already have thing with', name);
                            return [2 /*return*/];
                        }
                        logging_1.dbg('Warning, already have thing with this name,' +
                            ' creating new cert/conf');
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        logging_1.dbg('could not describe thing', thingName);
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, iot.createThing({
                            thingName: thingName
                        }).promise()];
                    case 6:
                        thing = _a.sent();
                        certRequest = utils_1.generateCSR(creds.identityId);
                        privateKey = certRequest.key;
                        return [4 /*yield*/, iot.createCertificateFromCsr({
                                setAsActive: true,
                                certificateSigningRequest: certRequest.csr
                            }).promise()];
                    case 7:
                        cert = _a.sent();
                        return [4 /*yield*/, iot.attachPrincipalPolicy({
                                principal: cert.certificateArn,
                                policyName: this.options.awsResources.iotThingsOwnPolicy
                            }).promise()];
                    case 8:
                        attached = _a.sent();
                        logging_1.dbg('Cert', cert.certificateArn);
                        logging_1.dbg('Attached', attached);
                        return [4 /*yield*/, iot.attachThingPrincipal({
                                thingName: thing.thingName,
                                principal: cert.certificateArn
                            }).promise()];
                    case 9:
                        thingPrincipal = _a.sent();
                        logging_1.dbg('thingPrincipal', thingPrincipal);
                        certificatePem = cert.certificatePem;
                        return [4 /*yield*/, this.writeThingConf(name, {
                                key: privateKey,
                                // ca: caString,
                                user: this.options.userCredentials.user,
                                certId: cert.certificateId,
                                cert: certificatePem,
                                clientId: thingName
                            })];
                    case 10:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThingsService.prototype.getThingName = function (creds, name) {
        return this.options.awsResources.stackName + \":\" + creds.identityId + \":\" + name;
    };
    ThingsService.prototype.getClient = function (conf) {
        return __awaiter(this, void 0, void 0, function () {
            var region, accountPrefix, brokerUrl, ca, client;
            return __generator(this, function (_a) {
                region = this.options.awsResources.region;
                accountPrefix = \"a17hetn6gw8xzh\";
                brokerUrl = \"mqtts://\" + accountPrefix + \"-ats.iot.\" + region + \".amazonaws.com\";
                ca = \"-----BEGIN CERTIFICATE-----\
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF\
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6\
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL\
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv\
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj\
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM\
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw\
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6\
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L\
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm\
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC\
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA\
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI\
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs\
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv\
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU\
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy\
rqXRfboQnoZsG4q5WTP468SQvvG5\
-----END CERTIFICATE-----\";
                client = mqtt.connect(brokerUrl, __assign({}, conf, { ca: [ca] }));
                client.on('connect', function () {
                    logging_1.dbg('MQTT connected!');
                });
                client.on('error', function (error) {
                    logging_1.dbg('MQTT error', error);
                });
                client.on('close', function () {
                    logging_1.dbg('MQTT close');
                });
                return [2 /*return*/, client];
            });
        });
    };
    ThingsService.prototype.loadThingClient = function (name) {
        var _this = this;
        return this.loadThingConf(name).then(function (conf) {
            if (conf == null) {
                throw new Error();
            }
            return _this.getClient(conf);
        });
    };
    ThingsService.prototype.loadLatestThingClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            var folder, files, filePaths, last, fn, basename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getConfigDir()];
                    case 1:
                        folder = _a.sent();
                        return [4 /*yield*/, util_1.promisify(fs.readdir)(folder)
                            // TODO: helper function for filtering
                        ];
                    case 2:
                        files = _a.sent();
                        filePaths = files
                            .filter(function (fn) { return fn.startsWith('thing-') && fn.endsWith('.json'); })
                            .map(function (fn) { return path.join(folder, fn); })
                            .map(function (fn) { return [fn, fs.statSync(fn)]; });
                        last = _.last(_.sortBy(filePaths, [function (_a) {
                                var fn = _a[0], stat = _a[1];
                                return stat.mtimeMs;
                            }]));
                        fn = last[0];
                        basename = path.basename(fn);
                        return [2 /*return*/, this.loadThingClient(basename.slice('thing-'.length, basename.length - '.json'.length))];
                }
            });
        });
    };
    ThingsService.prototype.loadThingConf = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var configDir, thingConfigPath, conf, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getConfigDir()];
                    case 1:
                        configDir = _c.sent();
                        thingConfigPath = this.getThingConfigPath(configDir, name);
                        if (!fs.existsSync(thingConfigPath)) {
                            return [2 /*return*/, null];
                        }
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, util.promisify(fs.readFile)(thingConfigPath)];
                    case 2:
                        conf = _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/, conf];
                }
            });
        });
    };
    ThingsService.prototype.writeThingConf = function (name, conf) {
        return __awaiter(this, void 0, void 0, function () {
            var configDir, thingConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getConfigDir()];
                    case 1:
                        configDir = _a.sent();
                        thingConfig = this.getThingConfigPath(configDir, name);
                        return [4 /*yield*/, util.promisify(fs.writeFile)(thingConfig, JSON.stringify(conf))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThingsService.prototype.getThingConfigPath = function (configDir, name) {
        return path.join(configDir, \"thing-\" + name + \".json\");
    };
    ThingsService.prototype.getConfigDir = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configDir = path.join(os.homedir(), '.pn');
                        if (!!fs.existsSync(configDir)) return [3 /*break*/, 2];
                        // TODO: sync ??
                        return [4 /*yield*/, util.promisify(fs.mkdir)(configDir)];
                    case 1:
                        // TODO: sync ??
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, configDir];
                }
            });
        });
    };
    ThingsService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, event_bus_1.EventBus,
            auth_service_1.AuthService])
    ], ThingsService);
    return ThingsService;
}());
exports.ThingsService = ThingsService;


//# sourceURL=webpack://commonjs/./src/services/iot/things.service.ts?"