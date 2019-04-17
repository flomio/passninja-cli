/* WEBPACK VAR INJECTION */(function(module) {
Object.defineProperty(exports, \"__esModule\", { value: true });
{
    process.env.DEBUG = process.env.PN_DEBUG || 'pn';
    process.noDeprecation = true;
}
//
__webpack_require__(/*! reflect-metadata */ \"./node_modules/reflect-metadata/Reflect.js\");
var pn_main_1 = __webpack_require__(/*! ./pn-main */ \"./src/pn-main.ts\");
var local_session_handler_service_1 = __webpack_require__(/*! ./services/readers/sessions/local/local-session-handler.service */ \"./src/services/readers/sessions/local/local-session-handler.service.ts\");
var abstract_session_handler_service_1 = __webpack_require__(/*! ./services/readers/sessions/abstract-session-handler.service */ \"./src/services/readers/sessions/abstract-session-handler.service.ts\");
if (__webpack_require__.c[__webpack_require__.s] === module) {
    pn_main_1.main({
        includeAdmin: true,
        includeSigning: true,
        configure: function (config) {
            return {
                overrides: config.nfc.keys ?
                    [{
                            provide: abstract_session_handler_service_1.SessionHandlerService,
                            useClass: local_session_handler_service_1.LocalSessionHandlerService
                        }] : []
            };
        }
    });
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/module.js */ \"./node_modules/webpack/buildin/module.js\")(module)))

//# sourceURL=webpack://commonjs/./src/pn.ts?"