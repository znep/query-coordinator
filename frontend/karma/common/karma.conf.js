var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');

module.exports = function ( karma ) {
  karma.set({
    singleRun: true,

    files: [
      'index.js'
    ],

    preprocessors: {
      'index.js': ['webpack', 'sourcemap']
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
              path.resolve(root, 'karma/common'),
              path.resolve(root, 'node_modules/socrata-components/common')
            ],
            loader: 'babel'
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      resolve: {
        root: [
          path.resolve('.'),
          path.resolve(root, 'public/javascripts/common'),
          path.resolve(root, 'karma/common')
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
