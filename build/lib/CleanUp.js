"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CleanUpService {
    constructor() {
        this.register = (fn) => this._items.push(fn);
        this._setup();
    }
    _setup() {
        const processes = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
        processes.forEach((proc) => {
            process.on(proc, () => {
                this._items.forEach(fn => {
                    try {
                        fn();
                    }
                    catch (err) {
                        console.error(`error cleaning up ${err.message}`);
                    }
                });
                this._items = [];
            });
        });
    }
}
let cleanUpService;
exports.cleanUpService = cleanUpService;
if (!cleanUpService) {
    exports.cleanUpService = cleanUpService = new CleanUpService();
}
//# sourceMappingURL=CleanUp.js.map