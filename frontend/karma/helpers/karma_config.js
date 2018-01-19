var _ = require('lodash');

module.exports = function(overrides) {
  var karmaConfig = _.extend(
    {
      basePath: '../../',

      singleRun: true,

      preprocessors: {
        'karma/*/index.js': ['webpack', 'sourcemap']
      },

      frameworks: ['mocha'],

      reporters: ['dots', 'mocha'],

      webpackMiddleware: {
        noInfo: true,
        quiet: true
      },

      mochaReporter: {
        showDiff: true
      },

      colors: true,

      logLevel: 'INFO',
      browserConsoleLogOptions: {
        level: 'log',
        format: '%b %T: %m',
        terminal: true
      },

      browsers: ['ChromeNoSandboxHeadless'],
      browserNoActivityTimeout: 1000 * 55,
      browserDisconnectTimeout: 1000 * 10,
      browserDisconnectTolerance: 5,
      customLaunchers: {
        ChromeNoSandboxHeadless: {
          base: 'Chrome',
          flags: [
            '--no-sandbox',
            '--headless',
            '--disable-gpu',
            '--remote-debugging-port=9222'
          ]
        }
      }
    },
    overrides
  );

  karmaConfig.files = _.compact(['public/javascripts/jquery-2.2.4.js'].concat(overrides.files));

  return karmaConfig;
};
