// Karma configuration
// Generated on Wed Jul 29 2015 12:58:51 GMT-0700 (PDT)

var webpackConfig = require('./webpack.config');
delete webpackConfig[1].entry;
delete webpackConfig[1].output;
webpackConfig[1].output = {
  libraryTarget: 'var',
  pathinfo: true
};
webpackConfig[1].devtool = 'inline-source-map';

webpackConfig[1].externals['socrata-utils'] = 'socrata.utils';
delete webpackConfig[1].externals['react'];
delete webpackConfig[1].externals['react-dom'];

webpackConfig[1].resolve.root = [ __dirname ];

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai-dom', 'chai', 'sinon', 'phantomjs-shim'],


    // list of files / patterns to load in the browser
    files: [
      'karma/chai.conf.js',
      'karma/testHelpers.js',
      'node_modules/d3/d3.js',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/leaflet/dist/leaflet.js',
      'node_modules/leaflet/dist/leaflet.css',
      'node_modules/lodash/index.js',
      'node_modules/moment/moment.js',
      'node_modules/socrata-utils/dist/socrata.utils.js',
      'node_modules/simple-statistics/src/simple_statistics.js',
      'node_modules/chroma-js/chroma.js',
      'src/views/styles/*.scss',
      'karma/testData.js',
      'karma/**/*spec.js',
      'karma/choroplethTestData/*.js',
      'karma/timelineTestData/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'node_modules/lodash/index.js': ['webpack'],
      'src/views/styles/*.scss': ['scss'],
      'karma/**/*spec.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    coverageReporter: {
      reporters: [
        {
          type: 'html',
          dir: 'coverage/'
        },
        {
          type: 'cobertura',
          dir: 'coverage/',
          file: 'coverage.xml' // To match simplecov
        }
      ]
    },

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

    scssPreprocessor: {
      options: {
        sourceMap: true,
        includePaths: [
          'node_modules'
        ]
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    webpack: webpackConfig[1], // TODO: make a dev version of this confic with source maps; specify that one
    webpackMiddleware: {
      noInfo: true
    }
  })
};
