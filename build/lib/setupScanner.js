"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
exports.setupScanner = (program) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    if (!program.user) {
        console.error('please enter your username to setup reader');
        process.exit(1);
    }
    if (!program.password) {
        console.error('please enter your password to setup reader');
        process.exit(1);
    }
});
//# sourceMappingURL=setupScanner.js.map