"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AuthService_1 = require("./AuthService");
var Configuration_1 = require("./Configuration");
describe('AuthService', function () {
    var auth = new AuthService_1.AuthService(new Configuration_1.Configuration());
    it('should be able to login', function (done) {
        auth.login().then(function (creds) {
            // console.log(creds);
            done();
        });
    });
});
//# sourceMappingURL=AuthService.spec.js.map