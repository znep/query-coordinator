var path = require('path');

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
      '/image.png': 'http://localhost:7019/base/karma/datasetLandingPage/data/mockImage.png'
    },

    preprocessors: {
      'karma/datasetLandingPage/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel'
          }
        ]
      },
      resolve: {
        alias: {
          'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
          'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
          '_': 'lodash',
          'jQuery': 'jquery'
        },
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

    port: 7019,
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
