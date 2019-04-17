
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { \"default\": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result[\"default\"] = mod;
    return result;
};
Object.defineProperty(exports, \"__esModule\", { value: true });
var commander_1 = __importDefault(__webpack_require__(/*! commander */ \"./node_modules/commander/index.js\"));
var logging_1 = __webpack_require__(/*! ../logging */ \"./src/logging.ts\");
var aws_resources_1 = __webpack_require__(/*! ./aws-resources */ \"./src/config/aws-resources.ts\");
var env = __importStar(__webpack_require__(/*! ../env */ \"./src/env.ts\"));
var fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));
/**
 * @param config
 *
 * This parses the environment and command line args, and also configures
 * the commandr `program`. Some commands are only included in the admin wiring
 * of the various application components.
 *
 * This isn't necessarily only `admin` commands
 *
 */
function parseEnvAndCommandline(config) {
    var subCommand = undefined;
    function makeCommand(name, extra) {
        var decl = (name + \" \" + extra).trim();
        var cmd = commander_1.default.command(decl);
        cmd.action(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var opts = cmd.opts();
            var options = cmd.options;
            var _loop_1 = function (opt) {
                var optName = opt.attributeName();
                if (opt.required && opts[optName] == null) {
                    cmd.help(function (s) { return s + \"\
--\" + opt.long + \" is required\
\"; });
                }
            };
            for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
                var opt = options_1[_a];
                _loop_1(opt);
            }
            subCommand = {
                positionalArgs: args.filter(function (a) { return typeof a === 'string'; }),
                opts: opts,
                name: name
            };
        });
        return cmd;
    }
    commander_1.default
        // TODO: collapse all these into one
        // TODO: watch multiple paths yeah ...
        // TODO: use organizationName for default pass name instead of pass.pkpass
        // pn sign folder --watch
        .option('--sign-pass <folder>', 'Sign pkpass from <folder> and exit')
        .option('--sign-batch <entry>', 'Sign pkpass batch from <entry> and exit')
        .option('--sign-gpay-batch <entry>', 'Sign gpay batch from <entry> and exit')
        .option('-o, --output-path [path]', 'Output pass files to output [path]', process.cwd())
        .option('-w, --watch', 'Watch mode')
        .option('-c, --certs-path <path>', '<path> to find certificates')
        // TODO: do we really want this in a public application ?
        .option('-p, --port [port]', '[port] to listen on', 3002)
        .option('-h, --host [host]', '[hostname] to listen for', '0.0.0.0')
        .option('-U, --user [user]', 'Login as [user]', 'demo@user.com')
        .option('-P, --password [password]', 'Login with [password]', 'Pass!@#$334--');
    if (config.includeAdmin) {
        commander_1.default.option('-a, --admin', 'Run in admin mode');
        makeCommand('create-pass-type', '<passTypeIdentifier>')
            .description('Make a pass')
            .option('-o, --output-path [folder]', '[folder] to output keys to', String, process.cwd())
            .option('-p, --passphrase <phrase>', '<phrase> to encrypt private key with')
            .option('-n, --cert-name <name>', '<name> of certificate');
    }
    commander_1.default.parse(process.argv);
    // TODO: add to the secrets manager ?
    var nfcKeys = env.PN_NFC_KEYS && fs.existsSync(env.PN_NFC_KEYS) ?
        JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString()) :
        undefined;
    var options = {
        subCommand: subCommand,
        demoBackend: {
            baseUrl: env.BACKEND_URL ||
                'https://' +
                    // TODO: rename this
                    aws_resources_1.awsResources.ApiGatewayRestApi +
                    '.execute-api.' +
                    aws_resources_1.awsResources.region +
                    '.amazonaws.com/' +
                    aws_resources_1.awsResources.stackName.split('-').pop()
        },
        sessionServer: {
            baseUrl: env.CLOUD_SESSION_URL ||
                'https://3kvoqeg1kg.execute-api.ap-southeast-1.amazonaws.com/dev/smart-tap'
        },
        awsResources: {
            // TODO: why not use `typeof awsResources` somewhere?
            userPool: aws_resources_1.awsResources.UserPool,
            identityPool: aws_resources_1.awsResources.IdentityPool,
            userPoolClient: aws_resources_1.awsResources.UserPoolClient,
            // TODO: deploy.sh should write these
            iotOwnThingsPolicy: aws_resources_1.awsResources.iotOwnThingsPolicy,
            region: aws_resources_1.awsResources.region,
            // TODO: add ability to choose a `stage` to attach to
            stackName: aws_resources_1.awsResources.stackName
        },
        nfc: {
            // PassNinjaDemo
            selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
            selectCollectorId: 77501435,
            keys: nfcKeys
        },
        gpay: {},
        args: {
            watch: Boolean(commander_1.default['watch']),
            signPass: commander_1.default['signPass'],
            signBatch: commander_1.default['signBatch'],
            signGpayBatch: commander_1.default['signGpayBatch'],
            outputPath: commander_1.default['outputPath'],
            certsPath: commander_1.default['certsPath']
        },
        server: {
            port: commander_1.default['port'],
            hostname: commander_1.default['host']
        },
        userCredentials: {
            password: commander_1.default['password'],
            user: commander_1.default['user']
        }
    };
    if (config.includeAdmin) {
        options.appleServiceAccount = {
            password: env.PASSNINJA_APPLE_SERVICE_ACCOUNT_PASS_WORD,
            teamId: 'Q338UYGFZ8',
            user: 'passninja@flomio.com'
        };
        options.args.admin = Boolean(commander_1.default['admin']);
        options.awsResources.ninjaKeysArn =
            'arn:aws:secretsmanager:us-east-1:448311138761' +
                ':secret:pass-ninja-web-server-e5HaT1';
        if (options.args.admin) {
            // TODO: defaults
            options.gpay.merchantId = '3175895186863635130';
            options.gpay.client_email = 'admin-341@pass-ninja.iam.gserviceaccount.com';
        }
    }
    logging_1.dbg({ options: options });
    return options;
}
exports.parseEnvAndCommandline = parseEnvAndCommandline;


//# sourceURL=webpack://commonjs/./src/config/config.ts?"