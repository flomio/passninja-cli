"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const request = require("request-promise-native");
const Logging_1 = require("../../Logging");
class RemoteSessionHandlerService /** extends AbstractSessionHandler */ {
    constructor(config) {
        this.config = config;
        this.handleMessage = (body) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            Logging_1.dbg('Sending rpc request');
            Logging_1.trc('Sending rpc request', body);
            const newVar = request.post({
                uri: this.config.sessionServer.baseUrl || 'http://localhost:4000/smart-tap',
                resolveWithFullResponse: true,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            Logging_1.dbg('Got http response');
            return JSON.parse(newVar.body);
        });
        this.isLocal = () => false;
    }
}
exports.RemoteSessionHandlerService = RemoteSessionHandlerService;
//# sourceMappingURL=RemoteSessionHandler.js.map