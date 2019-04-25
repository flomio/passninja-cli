
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
var http = __importStar(__webpack_require__(/*! http */ \"http\"));
var injection_tokens_1 = __webpack_require__(/*! ../injection-tokens */ \"./src/injection-tokens.ts\");
var express_app_holder_1 = __webpack_require__(/*! ./express-app-holder */ \"./src/services/express-app-holder.ts\");
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var HttpServer = /** @class */ (function () {
    function HttpServer(options, app) {
        this.options = options;
        this.app = app;
        this._server = http.createServer(app.expressApp);
    }
    HttpServer.prototype.serverRef = function () {
        return this._server;
    };
    HttpServer.prototype.listen = function () {
        var options = this.options.server;
        this._server.listen(options.port, options.hostname, function () {
            logging_1.dbg('Listening on', options);
        });
    };
    HttpServer = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, express_app_holder_1.ExpressAppHolder])
    ], HttpServer);
    return HttpServer;
}());
exports.HttpServer = HttpServer;


//# sourceURL=webpack://commonjs/./src/services/http-server.ts?"