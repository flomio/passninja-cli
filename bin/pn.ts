#! /usr/bin/env node

import * as program from 'commander'

import * as pkg from '../package.json'

import { setupScanner } from '../lib/setupScanner'

if (pkg.version) {
  program.version(pkg.version)
}

program
  .option('-u, --user <user>', 'Login as <user>')
  .option('-p, --pass <password>', 'Login with <password>')

program
  .command('setup')
  .description('setup your scanner for the first time')
  .action(() => {
    setupScanner(program as Commander)
  })

program.parse(process.argv)

if (!process.argv.slice(3).length) {
  program.outputHelp()
}

export declare interface Commander extends program.CommanderStatic {
  user: string
  pass: string
}
