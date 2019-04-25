#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const pkg = require("../package.json");
const setupScanner_1 = require("../lib/setupScanner");
if (pkg.version) {
    program.version(pkg.version);
}
program
    .option('-u, --user <user>', 'Login as <user>')
    .option('-p, --pass <password>', 'Login with <password>');
program
    .command('setup')
    .description('setup your scanner for the first time')
    .action(() => {
    setupScanner_1.setupScanner(program);
});
program.parse(process.argv);
if (!process.argv.slice(3).length) {
    program.outputHelp();
}
//# sourceMappingURL=pn.js.map