#! /usr/bin/env node
import * as pkg from '../package.json';
import * as program from 'commander';

require('dotenv').config();

// Program export must be before import from  scan or will cause
// circular dependency
export declare interface Program extends program.CommanderStatic {
  debug?: boolean;
  username?: string;
  password?: string;
  collectorId: number;
  passTypeIdentifier: string;
  http?: boolean;
  httpUrl?: string;
  httpHost?: string;
  httpPort?: string;
  httpPath?: string;
  mqtt?: boolean;
}

import { spoof } from './spoof';
import { scan } from './scan';

if (pkg.version) {
  program.version(pkg.version);
}

program
  .option('-d, --debug', 'Turns on debugging flag')
  .option('-u, --username <username>', 'Login as <username>')
  .option('-p, --password <password>', 'Login with <password>')
  .option('--pass-type-id <passTypeIdentifier>', 'The passTypeId to poll for')
  .option('--collector-id <collectorId>', 'The collectorId to poll for')
  .option('-h, --http', 'Send scans via http')
  .option('--http-url <httpUrl>', 'Http url, including "http://" to post scans to. If present will override httpHost, httpPort, httpPath')
  .option('--http-host <httpHost>', 'Http Host to post scans to')
  .option('--http-port <httpPort>', 'Http Port to post scans to')
  .option('--http-path <httpPath>', 'Http path to send scans to')
  .option('-m, --mqtt', 'Send scans via mqtt')
  .description('Run PassNinja Cli and scan some passes!');

program
  .command('scan')
  .description('start the reader to scan passes')
  .action(() => {
    if (!(program.http || program.mqtt)) {
      throw new Error('must supply either -http and/or -mqtt flag to determine where scans should be posted');
    }

    scan(program as Program).catch(err => console.error(err));
  });

program
  .command('spoof <type>')
  .description('spoofs a scan of specified type')
  .action((type: string) => {
    if (
      !(
        type === 'appleFlight' ||
        type === 'appleEvent' ||
        type === 'appleLoyalty' ||
        type === 'appleGift' ||
        type === 'appleCoupon' ||
        type === 'google'
      )
    ) {
      return console.error('can only spoof apple and google passes for now');
    }
    spoof(program as Program, type).catch(err => console.error(err));
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
