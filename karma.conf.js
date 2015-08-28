// Karma configuration
// Generated on Wed Jul 29 2015 12:58:51 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/lodash/lodash.js',
      'bower_components/d3/d3.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/socrata-utils/socrata.utils.js',
      'karma/testHelpers.js',
      'socrata.visualizations.DataProvider.js',
      'socrata.visualizations.SoqlDataProvider.js',
      'socrata.visualizations.Visualization.js',
      'socrata.visualizations.ColumnChart.js',
      'socrata.visualizations.rowInspector.js',
      'socrata.visualizations.rowInspector.html',
      'socrata.visualizations.columnChart.css',
      'karma/**/*spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'socrata.visualizations*.js': ['coverage']
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


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}

