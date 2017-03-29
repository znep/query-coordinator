var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'dataset-landing-page.config.js',
  [ 'karma/datasetLandingPage' ]
);
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'public/javascripts/jquery-2.2.4.js',
      'karma/datasetLandingPage/index.js',
      { pattern: 'karma/datasetLandingPage/data/*.png', watched: false, included: false, served: true }
    ],

    proxies: {
      '/image.png': `http://localhost:${karma.port}/base/karma/datasetLandingPage/data/mockImage.png`,
      '/api/file_data/guid': `http://localhost:${karma.port}/base/karma/datasetLandingPage/data/mockImage.png`
    },

    preprocessors: {
      'karma/datasetLandingPage/index.js': ['webpack', 'sourcemap']
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
