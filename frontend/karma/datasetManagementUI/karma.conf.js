var _ = require('lodash');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'dataset-management-ui.config.js',
  [ 'karma/datasetManagementUI', '.' ]
);

webpackConfig.externals = {
  jquery: 'jQuery'
};

// To make tests easier to write, we disable auto scss class prefixes.
var styleLoader = _(webpackConfig.module.loaders).find((loader) =>
  loader.loader.indexOf('localIdentName') >= 0
);
styleLoader.loader = 'style?sourceMap!css?modules&localIdentName=[local]&importLoaders=1!postcss!sass';

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/datasetManagementUI/index.js'
    ],

    preprocessors: {
      'karma/datasetManagementUI/index.js': ['webpack', 'sourcemap']
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
