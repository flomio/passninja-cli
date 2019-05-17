#! /usr/bin/env node

import * as pkg from '../package.json';
import * as program from 'commander';

// Program export must be before import from  startScanner or will cause
// circular dependency
export declare interface Program extends program.CommanderStatic {
  username?: string;
  password?: string;
}

import { startScanner } from './startScanner';

if (pkg.version) {
  program.version(pkg.version);
}

program
  .option('-u, --username <username>', 'Login as <username>')
  .option('-p, --password <password>', 'Login with <password>')
  .description('Run PassNinja Cli and scan some passes!')
  .parse(process.argv);

startScanner(program as Program);

// if (!process.argv.slice(2).length) {
//   program.outputHelp();
// }
