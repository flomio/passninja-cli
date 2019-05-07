import * as fs from 'fs';
import * as path from 'path';

export const requireClean = fn => {
  // if (!path.isAbsolute(fn)) {
  //     throw new Error(fn + \" should be absolute path\");
  // }
  // // We use eval because of webpack
  // eval(\"delete require.cache['\" + fn + \"']\");
  // return eval(\"require('\" + fn + \"')\");
};

export const requireApplePass = folder => {
  // if (!path.isAbsolute(folder)) {
  //     folder = path.join(process.cwd(), folder);
  // }
  // var candidates = ['pass.ts', 'pass.js', 'pass.json'];
  // for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
  //     var candidate = candidates_1[_i];
  //     var fullPath = path.join(folder, candidate);
  //     if (fs.existsSync(fullPath)) {
  //         var required = requireClean(fullPath);
  //         if (!candidate.endsWith('.json')) {
  //             return required['applePass'];
  //         }
  //         return required;
  //     }
  // }
  // throw new Error(\"pass.{ts,js,json} not found in \" + folder);
};
