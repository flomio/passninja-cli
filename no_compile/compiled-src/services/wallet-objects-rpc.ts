
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var wallet_objects_1 = __webpack_require__(/*! @passninja/wallet-objects */ \"../passninja-wallet-objects/dist/src/index.js\");
var injection_tokens_1 = __webpack_require__(/*! ../injection-tokens */ \"./src/injection-tokens.ts\");
var aws_secrets_1 = __webpack_require__(/*! ../secrets/aws-secrets */ \"./src/secrets/aws-secrets.ts\");
var googleapis_1 = __webpack_require__(/*! googleapis */ \"./node_modules/googleapis/build/src/index.js\");
var env = __importStar(__webpack_require__(/*! ../env */ \"./src/env.ts\"));
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
function api(replace) {
    if (replace === void 0) { replace = true; }
    return function (target, propertyKey, descriptor) {
        if (replace) {
            descriptor.value = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return this.client.then(function (c) { return c[propertyKey].apply(c, args); });
            };
        }
    };
}
var WalletObjectsRpc = /** @class */ (function () {
    function WalletObjectsRpc(options) {
        /* TODO: */
        if (env.GOOGLE_APPLICATION_CREDENTIALS) {
            var creds = __webpack_require__(\"./src/services sync recursive\")(env.GOOGLE_APPLICATION_CREDENTIALS);
            var merchantId = creds.merchant_id || options.gpay.merchantId;
            logging_1.dbg('Using GPay credentials at', env.GOOGLE_APPLICATION_CREDENTIALS);
            this.client = wallet_objects_1.WalletObjectsClient.create({
                issuerID: merchantId,
                googleAuth: googleapis_1.google.auth,
                credentials: creds
            });
        }
        else if (options.args.admin) {
            this.client = aws_secrets_1.getPNDemoSecrets(options).then(function (secrets) {
                var creds = {
                    client_email: options.gpay.client_email,
                    private_key: Buffer.from(secrets['passninja-service-account'], 'base64').toString()
                };
                return wallet_objects_1.WalletObjectsClient.create({
                    issuerID: options.gpay.merchantId,
                    credentials: creds, googleAuth: googleapis_1.google.auth
                });
            });
        }
        else {
            logging_1.dbg('Do not have GPay credentials');
        }
    }
    WalletObjectsRpc.prototype.addEventTicketClassMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addEventTicketObjectMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addFlightClassMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addFlightObjectMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addGiftCardClassMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addGiftCardObjectMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addLoyaltyClassMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addLoyaltyObjectMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addOfferClassMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.addOfferObjectMessage = function (id, message) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getEventTicketClass = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getEventTicketObject = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getFlightClass = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getFlightObject = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getGiftCardClass = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getGiftCardObject = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getJWTForSaveToGooglePay = function (wob, options) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getLoyaltyClass = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getLoyaltyObject = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getObject = function (id, kind) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getOfferClass = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.getOfferObject = function (id) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertEventTicketClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertEventTicketObject = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertFlightClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertFlightObject = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertGiftCardClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertGiftCardObject = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertLoyaltyClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertLoyaltyObject = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertObject = function (obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertOfferClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.insertOfferObject = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.listEventTicketClasses = function () {
        return undefined;
    };
    WalletObjectsRpc.prototype.listEventTicketObjects = function (classId) {
        return undefined;
    };
    WalletObjectsRpc.prototype.listFlightClasses = function () {
        return undefined;
    };
    WalletObjectsRpc.prototype.listFlightObjects = function (classId) {
        return undefined;
    };
    WalletObjectsRpc.prototype.listGiftCardClasses = function () {
        return undefined;
    };
    WalletObjectsRpc.prototype.listGiftCardObjects = function (classId) {
        return undefined;
    };
    WalletObjectsRpc.prototype.listLoyaltyClasses = function () {
        return undefined;
    };
    WalletObjectsRpc.prototype.listLoyaltyObjects = function (classId) {
        return undefined;
    };
    WalletObjectsRpc.prototype.listOfferClasses = function () {
        return undefined;
    };
    WalletObjectsRpc.prototype.listOfferObjects = function (classId) {
        return undefined;
    };
    WalletObjectsRpc.prototype.modifyLoyaltyObjectLinkedOffers = function (id, ops) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchEventTicketClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchEventTicketObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchFlightClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchFlightObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchGiftCardClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchGiftCardObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchLoyaltyClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchLoyaltyObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchObject = function (obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchOfferClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.patchOfferObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateClass = function (kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateEventTicketClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateEventTicketObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateFlightClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateFlightObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateGiftCardClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateGiftCardObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateLoyaltyClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateLoyaltyObject = function (id, obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateObject = function (obj) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateOfferClass = function (id, kls) {
        return undefined;
    };
    WalletObjectsRpc.prototype.updateOfferObject = function (id, obj) {
        return undefined;
    };
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addEventTicketClassMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addEventTicketObjectMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addFlightClassMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addFlightObjectMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addGiftCardClassMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addGiftCardObjectMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addLoyaltyClassMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addLoyaltyObjectMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addOfferClassMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"addOfferObjectMessage\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getEventTicketClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getEventTicketObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getFlightClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getFlightObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getGiftCardClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getGiftCardObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getJWTForSaveToGooglePay\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getLoyaltyClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getLoyaltyObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getOfferClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"getOfferObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertEventTicketClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertEventTicketObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertFlightClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertFlightObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertGiftCardClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertGiftCardObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertLoyaltyClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertLoyaltyObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertOfferClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"insertOfferObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", []),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listEventTicketClasses\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listEventTicketObjects\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", []),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listFlightClasses\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listFlightObjects\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", []),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listGiftCardClasses\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listGiftCardObjects\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", []),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listLoyaltyClasses\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listLoyaltyObjects\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", []),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listOfferClasses\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"listOfferObjects\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"modifyLoyaltyObjectLinkedOffers\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchEventTicketClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchEventTicketObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchFlightClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchFlightObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchGiftCardClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchGiftCardObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchLoyaltyClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchLoyaltyObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchOfferClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"patchOfferObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateEventTicketClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateEventTicketObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateFlightClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateFlightObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateGiftCardClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateGiftCardObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateLoyaltyClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateLoyaltyObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateObject\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateOfferClass\", null);
    __decorate([
        api(),
        __metadata(\"design:type\", Function),
        __metadata(\"design:paramtypes\", [String, Object]),
        __metadata(\"design:returntype\", Promise)
    ], WalletObjectsRpc.prototype, \"updateOfferObject\", null);
    WalletObjectsRpc = __decorate([
        injection_js_1.Injectable(),
        __param(0, injection_js_1.Inject(injection_tokens_1.CONFIG_TOKEN)),
        __metadata(\"design:paramtypes\", [Object])
    ], WalletObjectsRpc);
    return WalletObjectsRpc;
}());
exports.WalletObjectsRpc = WalletObjectsRpc;
var DemoWalletObjectsClient = /** @class */ (function () {
    function DemoWalletObjectsClient() {
    }
    DemoWalletObjectsClient = __decorate([
        injection_js_1.Injectable()
    ], DemoWalletObjectsClient);
    return DemoWalletObjectsClient;
}());
exports.DemoWalletObjectsClient = DemoWalletObjectsClient;


//# sourceURL=webpack://commonjs/./src/services/wallet-objects-rpc.ts?"