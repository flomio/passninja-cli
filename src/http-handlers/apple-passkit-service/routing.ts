
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { \"default\": mod };
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var passkit_web_protocol_service_1 = __webpack_require__(/*! ./db/passkit-web-protocol.service */ \"./src/http-handlers/apple-passkit-service/db/passkit-web-protocol.service.ts\");
var register_device_1 = __webpack_require__(/*! ./handlers/register-device */ \"./src/http-handlers/apple-passkit-service/handlers/register-device.ts\");
var express_app_holder_1 = __webpack_require__(/*! ../../services/express-app-holder */ \"./src/services/express-app-holder.ts\");
var express_1 = __importDefault(__webpack_require__(/*! express */ \"./node_modules/express/index.js\"));
var log_1 = __webpack_require__(/*! ./handlers/log */ \"./src/http-handlers/apple-passkit-service/handlers/log.ts\");
var device_registrations_1 = __webpack_require__(/*! ./handlers/device-registrations */ \"./src/http-handlers/apple-passkit-service/handlers/device-registrations.ts\");
var get_pass_1 = __webpack_require__(/*! ./handlers/get-pass */ \"./src/http-handlers/apple-passkit-service/handlers/get-pass.ts\");
var unregister_device_1 = __webpack_require__(/*! ./handlers/unregister-device */ \"./src/http-handlers/apple-passkit-service/handlers/unregister-device.ts\");
var PasskitRouting = /** @class */ (function () {
    function PasskitRouting(app, log, getPass, registrations, unregister, register) {
        var subApp = express_1.default();
        app.expressApp.use('/passkit-service', subApp);
        subApp.post(register_device_1.RegisterDeviceHandler.path, express_app_holder_1.handlePost({ handler: register }));
        subApp.post(log_1.LogHandler.path, express_app_holder_1.handlePost({ handler: log }));
        subApp.get(device_registrations_1.DeviceRegistrationsHandler.path, express_app_holder_1.handleGet({ handler: registrations }));
        subApp.get(get_pass_1.GetPassHandler.path, express_app_holder_1.handleGet({ handler: getPass, json: false }));
        subApp.delete(unregister_device_1.UnregisterDeviceHandler.path, express_app_holder_1.handlePost({ handler: getPass, allowNoContentType: true }));
    }
    PasskitRouting = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [express_app_holder_1.ExpressAppHolder,
            log_1.LogHandler,
            get_pass_1.GetPassHandler,
            device_registrations_1.DeviceRegistrationsHandler,
            unregister_device_1.UnregisterDeviceHandler,
            register_device_1.RegisterDeviceHandler])
    ], PasskitRouting);
    return PasskitRouting;
}());
exports.PasskitRouting = PasskitRouting;
exports.applePasskitServiceProviders = [
    passkit_web_protocol_service_1.PasskitWebProtocolService,
    get_pass_1.GetPassHandler,
    register_device_1.RegisterDeviceHandler,
    unregister_device_1.UnregisterDeviceHandler,
    device_registrations_1.DeviceRegistrationsHandler,
    log_1.LogHandler,
    PasskitRouting
];


//# sourceURL=webpack://commonjs/./src/http-handlers/apple-passkit-service/routing.ts?"