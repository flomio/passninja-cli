
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
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var auth_service_1 = __webpack_require__(/*! ../auth/auth.service */ \"./src/services/auth/auth.service.ts\");
var event_bus_1 = __webpack_require__(/*! ../event-bus */ \"./src/services/event-bus.ts\");
var aws_sdk_1 = __webpack_require__(/*! aws-sdk */ \"./node_modules/aws-sdk/lib/aws.js\");
var logging_1 = __webpack_require__(/*! ../../logging */ \"./src/logging.ts\");
var injection_tokens_1 = __webpack_require__(/*! ../../injection-tokens */ \"./src/injection-tokens.ts\");
var events_1 = __webpack_require__(/*! ../../events */ \"./src/events.ts\");
var IotService = /** @class */ (function () {
    function IotService(options, events, auth) {
        this.options = options;
        this.events = events;
        this.auth = auth;
        var scanEvents = [events_1.Events.smartTapData, events_1.Events.vasData];
        scanEvents.forEach(function (ev) {
            events.on(ev, function (data) {
                auth.waitCredentials().then(function (creds) {
                    var iotData = new aws_sdk_1.IotData({
                        credentials: creds,
                        // Luckily the prefix is the same for each region per account
                        endpoint: 'a17hetn6gw8xzh.iot.' +
                            options.awsResources.region +
                            '.amazonaws.com',
                        region: options.awsResources.region
                    });
                    var topic = options.awsResources.stackName + \"/\" + creds.identityId + \"/\" + ev;
                    var params = { topic: topic, payload: JSON.stringify(data), qos: 0 };
                    logging_1.dbg('publishing', params);
                    iotData.publish(params).promise().then(function (val) {
                        logging_1.dbg('published', val);
                    }).catch(logging_1.dbg);
                });
            });
        });
    }
    IotService = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object, event_bus_1.EventBus,
            auth_service_1.AuthService])
    ], IotService);
    return IotService;
}());
exports.IotService = IotService;


//# sourceURL=webpack://commonjs/./src/services/iot/iot.service.ts?"