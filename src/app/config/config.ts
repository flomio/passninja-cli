import * as fs from 'fs';
import * as program from 'commander';

import {awsResourcesDev} from './aws-resources-dev';
import {awsResourcesTest} from './aws-resources-test';

import {dbg} from '../logging';
// TODO: looks like a dead? import
// var env = __importStar(__webpack_require__(/*! ../env */ \"./src/env.ts\"));

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
    let subCommand;

    function makeCommand(name, extra) {

      var decl = (name + \" \" + extra).trim();

        var cmd = program.command(decl);

        cmd.action(function (...fnArgs: any[]) {
            var args = [];

            for (var _i = 0; _i < fnArgs.length; _i++) {
                args[_i] = fnArgs[_i];
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
              opts,
              name,
              positionalArgs: args.filter(arg => typeof arg === 'string'),
            };

        });

        return cmd;
    }

    if (config.includeSigning) {
      // TODO: collapse all these into one
      // TODO: watch multiple paths yeah ...
      // TODO: use organizationName for default pass name instead of pass.pkpass
      // pn sign folder --watch
      // TODO: do we really want this in a public application ?
      program
        .option('--sign-pass <folder>', 'Sign pkpass from <folder> and exit')
        .option('--sign-batch <entry>', 'Sign pkpass batch from <entry> and exit')
        .option('--sign-gpay-batch <entry>', 'Sign gpay batch from <entry> and exit')
        .option('-o, --output-path [path]', 'Output pass files to output [path]', process.cwd())
        .option('-w, --watch', 'Watch mode')
        .option('-c, --certs-path <path>', '<path> to find certificates');
    }

    program
        .option('-S, --stage <stage>', 'PassNinja [stage] backend to connect to', 'dev')
        .option('-p, --port [port]', '[port] to listen on', 3002)
        .option('-h, --host [host]', '[hostname] to listen for', '0.0.0.0')
        .option('-U, --user <user>', 'Login as <user>')
        .option('-P, --password <password>', 'Login with <password>')
        .option('-O, --offline', 'run in offline mode', false)
        .option('-r, --scan-report-end-point <endpoint>', 'http POST scan data to <endpoint>')
        .option('-s, --passkit-service',
          'Launch local PassKit web service and add webServiceURL to signed passes.' + 'Set NGROK_URL env var')

    if (config.includeAdmin) {
        program.option('-a, --admin', 'Run in admin mode');

        makeCommand('create-pass-type', '<passTypeIdentifier>')
          .description('Make a pass')
          .option('-o, --output-path [folder]', '[folder] to output keys to', String, process.cwd())
          .option('-p, --passphrase <phrase>', '<phrase> to encrypt private key with')
          .option('-n, --cert-name <name>', '<name> of certificate');
    }

    program.parse(process.argv);

    // TODO: add to the secrets manager ?
    var nfcKeys = env.PN_NFC_KEYS && fs.existsSync(env.PN_NFC_KEYS) ?
        JSON.parse(fs.readFileSync(process.env.PN_NFC_KEYS).toString()) :
        undefined;

        var stage = program['stage'];

    var awsResources = stage === 'test' ?
        awsResourcesTest : awsResourcesDev;

    var offline = Boolean(program['offline']);

    var options = {
        subCommand,
        demoBackend: {
            baseUrl: env.BACKEND_URL || \"https://\" + stage + \"-api.passninja.com\"
        },
        sessionServer: {
            baseUrl: env.CLOUD_SESSION_URL ||
                'https://cloudsessionalpha.passninja.com/smart-tap'
        },
        awsResources: {
            stage: program['stage'],
            userPool: awsResources.UserPool,
            identityPool: awsResources.IdentityPool,
            userPoolClient: awsResources.UserPoolClient,
            iotOwnThingsPolicy: awsResources.iotOwnThingsPolicy,
            iotThingsOwnPolicy: awsResources.iotThingsOwnPolicy,
            region: awsResources.region,
            stackName: awsResources.stackName
        },
        nfc: {
            // PassNinjaDemo
            selectPassTypeIdentifier: 'pass.com.ndudfield.nfc',
            selectCollectorId: 77501435,
            keys: nfcKeys
        },
        gpay: {},
        args: {
            offline,
            scanReportEndPoint: program['scanReportEndPoint'],
            watch: Boolean(program['watch']),
            passkitService: Boolean(program['passkitService']),
            signPass: program['signPass'],
            signBatch: program['signBatch'],
            signGpayBatch: program['signGpayBatch'],
            outputPath: program['outputPath'],
            certsPath: program['certsPath']
        },
        server: {
            port: program['port'],
            hostname: offline ? 'localhost' : program['host']
        },
        userCredentials: {
            password: program['password'],
            user: program['user']
        }
    };

    if (config.includeAdmin) {
        options.appleServiceAccount = {
            password: env.PASSNINJA_APPLE_SERVICE_ACCOUNT_PASS_WORD,
            teamId: 'Q338UYGFZ8',
            user: 'passninja@flomio.com'
        };
        options.args.admin = Boolean(program['admin']);
        options.awsResources.ninjaKeysArn =
            'arn:aws:secretsmanager:us-east-1:448311138761' +
                ':secret:pass-ninja-web-server-e5HaT1';
        if (options.args.admin) {
            // TODO: defaults
            options.gpay.merchantId = '3175895186863635130';
            options.gpay.client_email = 'admin-341@pass-ninja.iam.gserviceaccount.com';
        }
    }

    dbg({ options });

    return options;
}

exports.parseEnvAndCommandline = parseEnvAndCommandline;


//# sourceURL=webpack://commonjs/./src/config/config.ts?"
