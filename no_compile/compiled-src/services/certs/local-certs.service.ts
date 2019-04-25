
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
var pathModule = __importStar(__webpack_require__(/*! path */ \"path\"));
var LocalCertsService = /** @class */ (function () {
    function LocalCertsService(config) {
        this.config = config;
    }
    LocalCertsService.prototype.getPKPassCertSigningConfig = function (passTypeIdentifier) {
        var env = passTypeIdentifier.toUpperCase()
            .replace(/\\./g, '_') + '_PASSPHRASE';
        // TODO: add to the secrets manager
        // Perhaps some providers to access keys from various locations
        var passPhrase = process.env[env];
        if (!passPhrase) {
            throw new Error(\"Need to set \" + env + \" value\");
        }
        var name = passTypeIdentifier
            .replace(/^pass\\./, '') + '.pem';
        return { passPhrase: passPhrase, certPath: this.certPath(name) };
    };
    LocalCertsService.prototype.certPath = function (name) {
        return pathModule.join(this.config.args.certsPath, name);
    };
    LocalCertsService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object])
    ], LocalCertsService);
    return LocalCertsService;
}());
exports.LocalCertsService = LocalCertsService;


//# sourceURL=webpack://commonjs/./src/services/certs/local-certs.service.ts?"