
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { \"default\": mod };
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var express_app_holder_1 = __webpack_require__(/*! ./services/express-app-holder */ \"./src/services/express-app-holder.ts\");
var test_handler_1 = __webpack_require__(/*! ./http-handlers/test-handler */ \"./src/http-handlers/test-handler.ts\");
var logging_1 = __webpack_require__(/*! ./logging */ \"./src/logging.ts\");
var bodyParser = __importStar(__webpack_require__(/*! body-parser */ \"./node_modules/body-parser/index.js\"));
var cors_1 = __importDefault(__webpack_require__(/*! cors */ \"./node_modules/cors/lib/index.js\"));
var latest_pass_1 = __webpack_require__(/*! ./http-handlers/latest-pass */ \"./src/http-handlers/latest-pass.ts\");
var RoutingAndConfiguration = /** @class */ (function () {
    function RoutingAndConfiguration(applicationHolder, testHandler, latestPass) {
        logging_1.dbg('Adding routes');
        var app = applicationHolder.expressApp;
        app.use(cors_1.default());
        app.use(bodyParser.json());
        app.post('/test', express_app_holder_1.handlePost({ handler: testHandler }));
        app.get('/latestPass', express_app_holder_1.handleGet({ handler: latestPass, json: false }));
        app.get('/latestPass.pkpass', express_app_holder_1.handleGet({ handler: latestPass, json: false }));
        // app.use((error: Error,
        //          request: express.Request,
        //          response: express.Response,
        //          next: any) => {
        //
        // })
    }
    RoutingAndConfiguration = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [express_app_holder_1.ExpressAppHolder,
            test_handler_1.TestHandler,
            latest_pass_1.LatestPassHandler])
    ], RoutingAndConfiguration);
    return RoutingAndConfiguration;
}());
exports.RoutingAndConfiguration = RoutingAndConfiguration;


//# sourceURL=webpack://commonjs/./src/routing-and-configuration.ts?"