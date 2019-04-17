
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
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var auth_service_1 = __webpack_require__(/*! ../auth/auth.service */ \"./src/services/auth/auth.service.ts\");
var event_bus_1 = __webpack_require__(/*! ../event-bus */ \"./src/services/event-bus.ts\");
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
var events_1 = __webpack_require__(/*! ../../events */ \"./src/events.ts\");
var things_service_1 = __webpack_require__(/*! ./things.service */ \"./src/services/iot/things.service.ts\");
var utils_1 = __webpack_require__(/*! ./utils */ \"./src/services/iot/utils.ts\");
var IotService = /** @class */ (function () {
    function IotService(options, thingService, events, auth) {
        var _this = this;
        this.options = options;
        this.thingService = thingService;
        this.events = events;
        this.auth = auth;
        this._init = false;
        var scanEvents = [
            events_1.Events.smartTapData,
            events_1.Events.vasData
        ];
        scanEvents.forEach(function (ev) {
            events.on(ev, function (data) {
                logging_1.dbg(ev, JSON.stringify(data, null, 2));
                if (_this.mqtt == null) {
                    return;
                }
                else {
                    _this.mqtt.then(function (client) {
                        var cognitoId = client
                            .options
                            .clientId
                            .split(':')
                            .slice(1, 3)
                            .join(':');
                        var topic = options.awsResources.stackName + \"/\" + cognitoId + \"/\" + client.options.clientId + \"/scan\";
                        client.publish(topic, JSON.stringify(data));
                    });
                }
            });
        });
    }
    IotService.prototype.lazyInit = function () {
        if (!this._init) {
            this.mqtt = this.setupClient();
            this._init = true;
        }
    };
    IotService.prototype.setupClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            var creds, name, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.auth.noCredentials()) {
                            return [2 /*return*/, this.thingService.loadLatestThingClient()];
                        }
                        return [4 /*yield*/, this.auth.waitCredentials()];
                    case 1:
                        creds = _a.sent();
                        name = utils_1.machineId(this.options.awsResources.stackName + '/' +
                            creds.identityId);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.thingService.tryRegisterThing(name)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        console.log('e', e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, this.thingService.loadThingClient(name)];
                }
            });
        });
    };
    IotService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, things_service_1.ThingsService,
            event_bus_1.EventBus,
            auth_service_1.AuthService])
    ], IotService);
    return IotService;
}());
exports.IotService = IotService;


//# sourceURL=webpack://commonjs/./src/services/iot/iot.service.ts?"