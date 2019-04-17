
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
var path = __importStar(__webpack_require__(/*! path */ \"path\"));
function requireClean(fn) {
    if (!path.isAbsolute(fn)) {
        throw new Error(fn + \" should be absolute path\");
    }
    // We use eval because of webpack
    eval(\"delete require.cache['\" + fn + \"']\");
    return eval(\"require('\" + fn + \"')\");
}
exports.requireClean = requireClean;
function requireApplePass(folder) {
    if (!path.isAbsolute(folder)) {
        folder = path.join(process.cwd(), folder);
    }
    var candidates = ['pass.ts', 'pass.js', 'pass.json'];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var candidate = candidates_1[_i];
        var fullPath = path.join(folder, candidate);
        if (fs.existsSync(fullPath)) {
            var required = requireClean(fullPath);
            if (!candidate.endsWith('.json')) {
                return required['applePass'];
            }
            return required;
        }
    }
    throw new Error(\"pass.{ts,js,json} not found in \" + folder);
}
exports.requireApplePass = requireApplePass;


//# sourceURL=webpack://commonjs/./src/utils/require-pass-json.ts?"