#! /usr/bin/env node

import * as path from 'path';
import * as pkg from '../package.json';
import * as program from 'commander';

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Program export must be before import from  scan or will cause
// circular dependency
export declare interface Program extends program.CommanderStatic {
  username?: string;
  password?: string;
}

import { spoof } from './spoof';
import { scan }  from './scan';

if (pkg.version) {
  program.version(pkg.version);
}

program
  .option('-d, --debug', 'Turns on debugging flag')
  .option('-u, --username <username>', 'Login as <username>')
  .option('-p, --password <password>', 'Login with <password>')
  .description('Run PassNinja Cli and scan some passes!');

program
  .command('scan')
  .description('start the reader to scan passes')
  .action(() => {
    scan(program as Program)
      .catch(err => console.error(err));
  });

program
  .command('spoof <type>')
  .description('spoofs a scan of specified type')
  .action((type: string) => {
    if (!(type === 'appleFlight' || type === 'appleEvent'  || type === 'appleLoyalty' ||  type === 'appleGift' || type === 'appleCoupon' || type === 'google')) {
      return console.error('can only spoof apple and google passes for now');
    }
    spoof(type, program)
      .catch(err => console.error(err));
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
