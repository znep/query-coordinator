var socrataComponentsConfig = require('./config/webpack.config.prod');
var webpack = require('webpack');

delete socrataComponentsConfig.entry;
delete socrataComponentsConfig.output;

// see https://github.com/airbnb/enzyme/issues/47
socrataComponentsConfig.externals = {
  'jsdom': 'window',
  'cheerio': 'window',
  'react/addons': true,
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': true,
  'react/lib/ReactTestUtils': true
}

// socrataComponentsConfig.plugins = [
//   // Conditional requires workaround
//   // https://github.com/airbnb/enzyme/issues/47
//   // https://github.com/airbnb/enzyme/blob/master/docs/guides/webpack.md
//   new webpack.IgnorePlugin(/react\/addons/),
//   new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
//   new webpack.IgnorePlugin(/react\/lib\/ExecutionEnvironment/),
//   new webpack.IgnorePlugin(/react\/lib\/ReactTestUtils/)
// ];

socrataComponentsConfig.resolve = { root: [ __dirname, `${__dirname}/src` ] };
socrataComponentsConfig.devtool = 'inline-source-map';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (e.g. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai-dom', 'sinon-chai', 'chai', 'sinon'],

    module: {
      noParse: [
          /node_modules\/sinon\//,
      ]
    },
    resolve: {
      alias: {
          'sinon': 'sinon/pkg/sinon'
      }
    },

    // list of files / patterns to load in the browser
    files: [
      'test/js/index.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/js/index.js': ['webpack', 'sourcemap']
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

    webpack: socrataComponentsConfig,
    webpackMiddleware: {
      noInfo: true
    },

    phantomjsLauncher: {
      options: {
        viewportSize: {
          width: 1024,
          height: 768
        }
      }
    }
  })
};
