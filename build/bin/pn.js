#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pkg = require("../package.json");
const program = require("commander");
const configure_1 = require("../lib/configure");
if (pkg.version) {
    program.version(pkg.version);
}
program
    .option('-u, --username <username>', 'Login as <username>')
    .option('-p, --password <password>', 'Login with <password>');
program
    .command('configure')
    .description('setup your scanner for the first time')
    .action(() => {
    configure_1.configure(program);
});
program.parse(process.argv);
if (!process.argv.slice(3).length) {
    program.outputHelp();
}
// import { AuthorizationService } from './AuthorizationService';
//# sourceMappingURL=pn.js.map