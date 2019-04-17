
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { \"default\": mod };
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var debug_1 = __importDefault(__webpack_require__(/*! debug */ \"./node_modules/debug/src/index.js\"));
exports.dbg = debug_1.default('pn');
exports.trc = debug_1.default('pn-trc');
exports.print = console.log;


//# sourceURL=webpack://commonjs/./src/logging.ts?"