/* eslint-env node */

// Karma configuration for common code.
var path = require('path');

// TODO Move base webpack config from frontend/webpack into common, then use here.
var webpackConfig = {
  context: __dirname,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: [
            'babel-preset-es2015'
          ].map(require.resolve),
          plugins: [
            'babel-plugin-transform-object-rest-spread'
          ].map(require.resolve)
        }
      }
    ]
  },
  resolve: {
    modules: [
      // Let tests import modules (i.e, import FeatureFlags from 'common/FeatureFlags')
      path.resolve('../../'),

      // Allow code under test to require dependencies in karma_config's package.json.
      '../karma_config/node_modules'
    ],
    alias: {
      'lodash': path.join(__dirname, '.', 'node_modules/lodash/index.js'),
      'jquery': path.join(__dirname, '.', 'node_modules/jquery/dist/jquery.js')
    }
  },
  devtool: 'inline-source-map'
};

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/sinon/pkg/sinon.js',
      '../spec/**/*.spec.js'
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // Load specs through webpack.
      '../spec/**/*.spec.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    }
  });
};
