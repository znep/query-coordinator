// Karma configuration
// Generated on Wed Jul 29 2015 12:58:51 GMT-0700 (PDT)

var webpackConfig = require('./webpack.config');
delete webpackConfig.entry;
delete webpackConfig.output;
webpackConfig.output = {
  libraryTarget: 'var',
  pathinfo: true
};
webpackConfig.devtool = 'inline-source-map';

webpackConfig.externals['socrata-utils'] = 'socrata.utils';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon', 'phantomjs-shim'],


    // list of files / patterns to load in the browser
    files: [
      'karma/testHelpers.js',
      'bower_components/d3/d3.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/leaflet/dist/leaflet.js',
      'bower_components/leaflet/dist/leaflet.css',
      'bower_components/lodash/lodash.js',
      'bower_components/moment/moment.js',
      'bower_components/socrata-utils/socrata.utils.js',
      'bower_components/vector-tile/dist/vectortile.js',
      'bower_components/simple-statistics/src/simple_statistics.js',
      'bower_components/chroma-js/chroma.js',
      'src/views/styles/*.scss',
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
          'bower_components'
        ]
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    webpack: webpackConfig, // TODO: make a dev version of this confic with source maps; specify that one
    webpackMiddleware: {
      noInfo: true
    }
  })
};

