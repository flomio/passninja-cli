
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var os = __importStar(__webpack_require__(/*! os */ \"os\"));
var EnvironmentService = /** @class */ (function () {
    function EnvironmentService() {
    }
    EnvironmentService.prototype.isLinux = function () {
        return os.platform() === 'linux';
    };
    EnvironmentService.prototype.platform = function () {
        return os.platform();
    };
    EnvironmentService.prototype.isOSX = function () {
        return this.platform() === 'darwin';
    };
    EnvironmentService = __decorate([
        injection_js_1.Injectable()
    ], EnvironmentService);
    return EnvironmentService;
}());
exports.EnvironmentService = EnvironmentService;


//# sourceURL=webpack://commonjs/./src/services/env/environment.service.ts?"