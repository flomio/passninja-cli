
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
var passkit_web_protocol_service_1 = __webpack_require__(/*! ../db/passkit-web-protocol.service */ \"./src/http-handlers/apple-passkit-service/db/passkit-web-protocol.service.ts\");
var _ = __importStar(__webpack_require__(/*! lodash */ \"./node_modules/lodash/lodash.js\"));
var logging_1 = __webpack_require__(/*! ../../../logging */ \"./src/logging.ts\");
var UnregisterDeviceHandler = /** @class */ (function () {
    function UnregisterDeviceHandler(service) {
        this.service = service;
    }
    /**
     * /{version}/devices/
     *      {deviceLibraryIdentifier}
     *      /registrations/
     *        {passTypeIdentifier}/{serialNumber}
     */
    UnregisterDeviceHandler.prototype.handle = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var body, req, res, params, all;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = args.body, req = args.req, res = args.res;
                        params = req.params;
                        all = _.extend({}, body, params);
                        logging_1.dbg('unregister device', all, req.url);
                        return [4 /*yield*/, this.service.unregisterDevice(all)];
                    case 1:
                        _a.sent();
                        res.status(200);
                        res.send(null);
                        return [2 /*return*/];
                }
            });
        });
    };
    UnregisterDeviceHandler.path = '/:version' +
        '/devices/' +
        ':deviceLibraryIdentifier' +
        '/registrations/' +
        ':passTypeIdentifier/:serialNumber';
    UnregisterDeviceHandler = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [passkit_web_protocol_service_1.PasskitWebProtocolService])
    ], UnregisterDeviceHandler);
    return UnregisterDeviceHandler;
}());
exports.UnregisterDeviceHandler = UnregisterDeviceHandler;


//# sourceURL=webpack://commonjs/./src/http-handlers/apple-passkit-service/handlers/unregister-device.ts?"