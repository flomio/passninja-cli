export class CreatePassTypeCommand {

}


// Object.defineProperty(exports, \"__esModule\", { value: true });
// var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
// var injection_tokens_1 = __webpack_require__(/*! ../injection-tokens */ \"./src/injection-tokens.ts\");
var apple_signing_cert_gen_1 = __webpack_require__(/*! apple-signing-cert-gen */ \"../apple-signing-cert-gen/dist/index.js\");
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var tags_1 = __webpack_require__(/*! ../tags */ \"./src/tags.ts\");

var CreatePassTypeCommand = /** @class */ (function () {
    function CreatePassTypeCommand(config) {
        this.config = config;
    }
    CreatePassTypeCommand.prototype.run = function (command) {
        return __awaiter(this, void 0, void 0, function () {
            var appleServiceAccount, opts, parameters, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appleServiceAccount = this.config.appleServiceAccount;
                        if (appleServiceAccount == null || appleServiceAccount.password == null) {
                            throw new Error('Password for service account must be set');
                        }
                        opts = command.opts;
                        parameters = {
                            password: opts.passphrase,
                            passTypeIdentifier: command.positionalArgs[0],
                            name: opts.certName,
                            outputPath: opts.outputPath,
                            credentials: {
                                password: appleServiceAccount.password,
                                teamId: appleServiceAccount.teamId,
                                user: appleServiceAccount.user
                            }
                        };
                        logging_1.dbg('Making cert with', { parameters: parameters });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, apple_signing_cert_gen_1.makeCert(parameters)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        logging_1.dbg('Could not make cert, check that cert ' +
                            'does not exist already');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CreatePassTypeCommand = __decorate([
        injection_js_1.Injectable(),
        tags_1.AdminOnly(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object])
    ], CreatePassTypeCommand);
    return CreatePassTypeCommand;
}());
exports.CreatePassTypeCommand = CreatePassTypeCommand;


//# sourceURL=webpack://commonjs/./src/commands/create-pass-type.ts?"
