"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Configuration_1 = require("../lib/Configuration");
var AuthService_1 = require("../lib/AuthService");
var MqttService_1 = require("../lib/MqttService");
var Reader_1 = require("../lib/Reader");
var SessionHandler_1 = require("../lib/SessionHandler");
exports.scan = function (program) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var config, username, password, auth, mqtt, localSession, readerSession;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                config = new Configuration_1.Configuration();
                username = program.username, password = program.password;
                auth = new AuthService_1.AuthService(config);
                return [4 /*yield*/, auth.login(username, password)];
            case 1:
                _a.sent();
                mqtt = new MqttService_1.MqttService(config, auth);
                return [4 /*yield*/, mqtt.connect()];
            case 2:
                _a.sent();
                return [4 /*yield*/, mqtt.subscribe()];
            case 3:
                _a.sent();
                localSession = new SessionHandler_1.SessionHandler(config);
                readerSession = new Reader_1.Reader(localSession, config);
                readerSession.start();
                console.log('started');
                return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=scan.js.map