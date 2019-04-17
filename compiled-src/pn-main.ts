
Object.defineProperty(exports, \"__esModule\", { value: true });
var config_1 = __webpack_require__(/*! ./config/config */ \"./src/config/config.ts\");
var socket_server_service_1 = __webpack_require__(/*! ./services/socket-server.service */ \"./src/services/socket-server.service.ts\");
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var express_app_holder_1 = __webpack_require__(/*! ./services/express-app-holder */ \"./src/services/express-app-holder.ts\");
var http_server_1 = __webpack_require__(/*! ./services/http-server */ \"./src/services/http-server.ts\");
var injection_tokens_1 = __webpack_require__(/*! ./injection-tokens */ \"./src/injection-tokens.ts\");
var test_handler_1 = __webpack_require__(/*! ./http-handlers/test-handler */ \"./src/http-handlers/test-handler.ts\");
var routing_and_configuration_1 = __webpack_require__(/*! ./routing-and-configuration */ \"./src/routing-and-configuration.ts\");
var application_1 = __webpack_require__(/*! ./application */ \"./src/application.ts\");
var remote_manifest_signer_service_1 = __webpack_require__(/*! ./services/signing/remote-manifest-signer.service */ \"./src/services/signing/remote-manifest-signer.service.ts\");
var sign_pass_1 = __webpack_require__(/*! ./commands/sign-pass */ \"./src/commands/sign-pass.ts\");
var store_1 = __webpack_require__(/*! ./services/store */ \"./src/services/store.ts\");
var queue_service_1 = __webpack_require__(/*! ./services/queue.service */ \"./src/services/queue.service.ts\");
var latest_pass_1 = __webpack_require__(/*! ./http-handlers/latest-pass */ \"./src/http-handlers/latest-pass.ts\");
var wallet_objects_rpc_1 = __webpack_require__(/*! ./services/wallet-objects-rpc */ \"./src/services/wallet-objects-rpc.ts\");
var sign_gpay_pass_1 = __webpack_require__(/*! ./commands/sign-gpay-pass */ \"./src/commands/sign-gpay-pass.ts\");
var manifest_signer_service_1 = __webpack_require__(/*! ./services/signing/manifest-signer.service */ \"./src/services/signing/manifest-signer.service.ts\");
var local_manifest_signer_service_1 = __webpack_require__(/*! ./services/signing/local-manifest-signer.service */ \"./src/services/signing/local-manifest-signer.service.ts\");
var readers_service_1 = __webpack_require__(/*! ./services/readers/readers.service */ \"./src/services/readers/readers.service.ts\");
var event_bus_1 = __webpack_require__(/*! ./services/event-bus */ \"./src/services/event-bus.ts\");
var auth_service_1 = __webpack_require__(/*! ./services/auth/auth.service */ \"./src/services/auth/auth.service.ts\");
var iot_service_1 = __webpack_require__(/*! ./services/iot/iot.service */ \"./src/services/iot/iot.service.ts\");
var create_pass_type_1 = __webpack_require__(/*! ./commands/create-pass-type */ \"./src/commands/create-pass-type.ts\");
var abstract_session_handler_service_1 = __webpack_require__(/*! ./services/readers/sessions/abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");
var remote_session_handler_service_1 = __webpack_require__(/*! ./services/readers/sessions/remote-session-handler.service */ \"./src/services/readers/sessions/remote-session-handler.service.ts\");
var logging_1 = __webpack_require__(/*! ./logging */ \"./src/logging.ts\");
function makeModule(config, moduleConfig) {
    var base = [
        { useValue: config, provide: injection_tokens_1.CONFIG_TOKEN },
        {
            provide: manifest_signer_service_1.ManifestSignerService,
            useClass: config.args.certsPath ?
                local_manifest_signer_service_1.LocalManifestSigner :
                remote_manifest_signer_service_1.RemoteManifestSigner
        },
        { provide: abstract_session_handler_service_1.SessionHandlerService, useClass: remote_session_handler_service_1.RemoteSessionHandlerService },
        express_app_holder_1.ExpressAppHolder,
        http_server_1.HttpServer,
        socket_server_service_1.SocketServerService,
        readers_service_1.ReadersService,
        test_handler_1.TestHandler,
        auth_service_1.AuthService,
        iot_service_1.IotService,
        routing_and_configuration_1.RoutingAndConfiguration,
        application_1.Application,
        queue_service_1.QueueService,
        create_pass_type_1.CreatePassTypeCommand,
        wallet_objects_rpc_1.WalletObjectsRpc,
        latest_pass_1.LatestPassHandler,
        store_1.StateStoreService,
        sign_pass_1.SignPassCommand,
        sign_gpay_pass_1.SignGpayPassCommand,
        event_bus_1.EventBus
    ];
    var extraConf = moduleConfig.configure ?
        moduleConfig.configure(config) :
        {};
    if (extraConf.overrides) {
        extraConf.overrides.forEach(function (p) {
            if (p.provide) {
                var ix = base.findIndex(function (prov) {
                    return p.provide === prov || p.provide === prov.provide;
                });
                logging_1.trc('Replacing', base[ix], 'with', p);
                base[ix] = p;
            }
        });
    }
    return base;
}
function main(moduleConfig) {
    var options = config_1.parseEnvAndCommandline(moduleConfig);
    var baseModules = makeModule(options, moduleConfig);
    var injector = injection_js_1.ReflectiveInjector.resolveAndCreate(baseModules);
    var app = injector.get(application_1.Application);
    app.run().then();
}
exports.main = main;


//# sourceURL=webpack://commonjs/./src/pn-main.ts?"