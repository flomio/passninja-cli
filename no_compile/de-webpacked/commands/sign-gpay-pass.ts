
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
var store_1 = __webpack_require__(/*! ../services/store */ \"./src/services/store.ts\");
var wallet_objects_rpc_1 = __webpack_require__(/*! ../services/wallet-objects-rpc */ \"./src/services/wallet-objects-rpc.ts\");
var require_pass_json_1 = __webpack_require__(/*! ../utils/require-pass-json */ \"./src/utils/require-pass-json.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../injection-tokens */ \"./src/injection-tokens.ts\");
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var SignGpayPassCommand = /** @class */ (function () {
    function SignGpayPassCommand(store, options, google) {
        this.store = store;
        this.options = options;
        this.google = google;
    }
    SignGpayPassCommand.prototype.signGPayBatch = function (entryPath) {
        return __awaiter(this, void 0, void 0, function () {
            var func, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        func = require_pass_json_1.requireClean(entryPath).googleBatch;
                        return [4 /*yield*/, func(this.google)];
                    case 1:
                        result = _a.sent();
                        fs.writeFileSync('jwts.html', result.map(function (_a) {
                            var obj = _a[0], jwt = _a[1];
                            if (obj.kind === 'walletobjects#loyaltyObject') {
                                return \"<a href='\" + jwt + \"'>\" + obj.accountName + \" - \" + obj.accountId + \"</a> \";
                            }
                            throw new Error('unimplemented! Nick is a !@#$');
                        }).join('<br>\
'));
                        return [2 /*return*/];
                }
            });
        });
    };
    SignGpayPassCommand = __decorate([
        injection_js_1.Injectable(),
        __param(1, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [store_1.StateStoreService, Object, wallet_objects_rpc_1.WalletObjectsRpc])
    ], SignGpayPassCommand);
    return SignGpayPassCommand;
}());
exports.SignGpayPassCommand = SignGpayPassCommand;


//# sourceURL=webpack://commonjs/./src/commands/sign-gpay-pass.ts?"