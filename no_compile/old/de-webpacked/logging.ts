import * as debug from 'debug';

export const dbg = debug('pn');
export const logErr = dbg;
export const trc = debug('pn-trc');
export const print = console.log;
