/* WEBPACK VAR INJECTION */(function(module) {
Object.defineProperty(exports, \"__esModule\", { value: true });
//
{
    process.env.DEBUG = process.env.PN_DEBUG || 'pn';
    process.noDeprecation = true;
}
//
__webpack_require__(/*! reflect-metadata */ \"./node_modules/reflect-metadata/Reflect.js\");
var pn_main_1 = __webpack_require__(/*! ./pn-main */ \"./src/pn-main.ts\");
if (__webpack_require__.c[__webpack_require__.s] === module) {
    pn_main_1.main({ includeAdmin: false });
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/module.js */ \"./node_modules/webpack/buildin/module.js\")(module)))

//# sourceURL=webpack://commonjs/./src/pn-cloud.ts?"