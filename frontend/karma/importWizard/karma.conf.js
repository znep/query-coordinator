var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'import-wizard.config.js',
  [ 'karma/importWizard' ]
);

module.exports = function(karma) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/importWizard/index.js'
    ],

    preprocessors: {
      'karma/importWizard/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['mocha', 'dots'],

    webpack: webpackConfig,

    webpackMiddleware: {
      noInfo: true
    },

    mochaReporter: {
      showDiff: true
    },

    colors: true,
    logLevel: 'INFO',

    browsers: [
      'Chrome',
      'Firefox',
      'PhantomJS'
    ],
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
  });
};
