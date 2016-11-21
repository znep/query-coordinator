var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
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

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            include: [
              path.resolve(root, 'public/javascripts'),
              path.resolve(root, 'node_modules/socrata-components/common'),
              path.resolve(root, 'karma/datasetLandingPage')
            ],
            loader: 'babel'
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      resolve: {
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/datasetLandingPage'),
          path.resolve('karma/datasetLandingPage')
        ]
      }
    },

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
