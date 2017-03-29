var _ = require('lodash');

module.exports = function(overrides) {
  return _.extend(
    {
      basePath: '../../',

      singleRun: true,

      preprocessors: {
        'karma/*/index.js': ['webpack', 'sourcemap']
      },

      frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

      reporters: ['dots', 'mocha'],

      webpackMiddleware: {
        noInfo: true
      },

      mochaReporter: {
        showDiff: true
      },

      colors: true,
      logLevel: 'INFO',

      browsers: ['PhantomJS'],
      browserNoActivityTimeout: 1000 * 55,
      browserDisconnectTimeout: 1000 * 10,
      browserDisconnectTolerance: 5,
      phantomjsLauncher: {
        options: {
          viewportSize: {
            width: 1024,
            height: 768
          }
        }
      }
    },
    overrides
  );
};
