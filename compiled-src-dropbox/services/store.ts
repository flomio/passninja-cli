
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var rxjs_1 = __webpack_require__(/*! rxjs */ \"./node_modules/rxjs/_esm5/index.js\");
var StateStoreService = /** @class */ (function () {
    function StateStoreService() {
        this.MAX_PASSES = 20;
        this.latestPkPass = new rxjs_1.BehaviorSubject(null);
        this.passes = [];
    }
    StateStoreService.prototype.setPass = function (pass, buffer) {
        this.latestPkPass.next(buffer);
        var index = this.findPass({
            passTypeIdentifier: pass.passTypeIdentifier,
            serialNumber: pass.serialNumber
        }).index;
        if (index) {
            this.passes.splice(index, 1);
        }
        var lastModified = new Date().toUTCString();
        this.passes.unshift({ pass: pass, buffer: buffer, lastModified: lastModified });
        while (this.passes.length > this.MAX_PASSES) {
            this.passes.pop();
        }
    };
    StateStoreService.prototype.findPass = function (params) {
        var index = this.passes.findIndex(function (p) { return p.pass.passTypeIdentifier === params.passTypeIdentifier &&
            p.pass.serialNumber === params.serialNumber; });
        return { index: index, pass: this.passes[index] };
    };
    StateStoreService = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [])
    ], StateStoreService);
    return StateStoreService;
}());
exports.StateStoreService = StateStoreService;


//# sourceURL=webpack://commonjs/./src/services/store.ts?"