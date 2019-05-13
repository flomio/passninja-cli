#! /usr/bin/env node

import * as pkg from '../package.json';
import * as program from 'commander';
export declare interface Program extends program.CommanderStatic {
  username?: string;
  password?: string;
}

import { configure } from '../lib/configure';

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
    configure(program as Program);
  });

program.parse(process.argv);

// if (!process.argv.slice(3).length) {
//   program.outputHelp();
// }
