var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'catalog-landing-page.config.js',
  [ 'karma/catalogLandingPage' ]
);

// In Rails, some modules are handled specially. We don't want that for tests.
delete webpackConfig.resolve.alias;
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/catalogLandingPage/index.js'
    ],

    preprocessors: {
      'karma/catalogLandingPage/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

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
