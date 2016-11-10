var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/datasetManagementUI/index.js',
      { pattern: 'karma/datasetManagementUI/data/*.png', watched: false, included: false, served: true }
    ],

    preprocessors: {
      'karma/datasetManagementUI/index.js': ['webpack', 'sourcemap']
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
              path.resolve(root, 'karma/datasetManagementUI')
            ],
            loader: 'babel'
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      resolve: {
        alias: {
          'socrata-utils': path.resolve(root, 'node_modules/socrata-utils/dist/socrata.utils.js'),
          'socrata.utils': path.resolve(root, 'node_modules/socrata-utils/dist/socrata.utils.js'),
          '_': path.resolve(root, 'node_modules/lodash'),
          'jQuery': path.resolve(root, 'node_modules/jquery/dist/jquery.js'),
          'jquery': path.resolve(root, 'node_modules/jquery/dist/jquery.js'),
          'react': path.resolve(root, 'node_modules/react'),
          'react-dom': path.resolve(root, 'node_modules/react-dom')
        },
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/datasetManagementUI'),
          path.resolve('karma/datasetManagementUI')
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    mochaReporter: {
      showDiff: true
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
