"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var MqttService_1 = require("./MqttService");
var Configuration_1 = require("./Configuration");
var AuthService_1 = require("./AuthService");
var operators_1 = require("rxjs/operators");
describe('MqttService', function () {
    var config = new Configuration_1.Configuration();
    var auth = new AuthService_1.AuthService(config);
    var mqtt;
    beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!auth.loggedIn) return [3 /*break*/, 2];
                    return [4 /*yield*/, auth.login()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    expect(auth.loggedIn).toEqual(true);
                    mqtt = new MqttService_1.MqttService(config, auth);
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () {
        mqtt.disconnect();
    });
    it('should connect and disconnect', function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect(mqtt.connected).toEqual(false);
                    return [4 /*yield*/, mqtt.connect()];
                case 1:
                    _a.sent();
                    expect(mqtt.connected).toEqual(true);
                    mqtt.disconnect();
                    expect(mqtt.connected).toEqual(false);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should subscribe to the correct topic', function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var res;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mqtt.connect()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, mqtt.subscribe()];
                case 2:
                    res = _a.sent();
                    expect(res).toEqual([{ 'qos': 0, 'topic': auth.identityId }]);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should publish to the correct topic', function (done) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var testMessage, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, mqtt.connect()];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, mqtt.subscribe()];
                case 2:
                    _b.sent();
                    testMessage = 'testing yo';
                    mqtt.messages$.pipe(operators_1.take(1)).subscribe(function (message) {
                        expect(message.message).toEqual(testMessage);
                        done();
                    });
                    _a = expect;
                    return [4 /*yield*/, mqtt.publish(testMessage)];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toEqual(undefined);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=MqttService.spec.js.map