// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts
require('ts-node').register({
    project: 'e2e/tsconfig.e2e.json' // if you have one
});
const { SpecReporter } = require('jasmine-spec-reporter');

var basePath = __dirname;

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './lib/**/*.e2e-spec.ts',
    '../bin/**/*.e2e-spec.ts'
  ],

  // added chromeOptoions --test-type to allow https with self-issued certificate
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      args: ['--test-type']
    }
  },
  SELENIUM_PROMISE_MANAGER: false,
  //change to false to support safari
  directConnect: true,
  baseUrl: '(http://localhost:4200/)',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    //set defaultTI to 30000 get library loaded to change this back
    //after getting input from console.
    defaultTimeoutInterval: 30000,
    print: function () { }
  },


  beforeLaunch: function () { },

  onPrepare: function () {
    jasmine.getEnv().addReporter(new SpecReporter({
      displayFailuresSummary: true,
      displayFailuredSpec: true,
      displaySuiteNumber: true,
      displaySpecDuration: true
    }));
   }
}
