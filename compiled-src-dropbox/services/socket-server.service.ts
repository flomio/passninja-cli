
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var WebSocket = __importStar(__webpack_require__(/*! ws */ \"./node_modules/ws/index.js\"));
var injection_js_1 = __webpack_require__(/*! injection-js */ \"./node_modules/injection-js/index.js\");
var http_server_1 = __webpack_require__(/*! ./http-server */ \"./src/services/http-server.ts\");
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var SocketServerService = /** @class */ (function () {
    function SocketServerService(server) {
        var _this = this;
        this._server = new WebSocket.Server({ server: server.serverRef() });
        this._sockets = new Set();
        this._server.on('connection', function (ws) {
            logging_1.dbg('Socket connected!');
            _this._sockets.add(ws);
            var handleMessage = function (message) {
            };
            ws.on('message', handleMessage);
            ws.on('close', function (code) {
                logging_1.dbg('Socket closed!', code);
                _this._sockets.delete(ws);
            });
        });
    }
    SocketServerService.prototype.sendAll = function (message) {
        var serialized = JSON.stringify(message);
        var sent = 0;
        this._sockets.forEach(function (ws) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(serialized);
                sent++;
            }
        });
        return sent;
    };
    SocketServerService = __decorate([
        injection_js_1.Injectable(),
        __metadata(\"design:paramtypes\", [http_server_1.HttpServer])
    ], SocketServerService);
    return SocketServerService;
}());
exports.SocketServerService = SocketServerService;


//# sourceURL=webpack://commonjs/./src/services/socket-server.service.ts?"