// Karma configuration
// Generated on Thu Jun 04 2015 16:49:30 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sprockets', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      'app/javascripts/editor/init.js',
      'spec/karma/chai.js',
      'spec/karma/StandardMocks.js',
      'spec/karma/TestDom.js',
      'spec/karma/AssetFinderMocker.js',
      'spec/karma/SquireMocker.js',
      'spec/karma/dataGenerators.js',
      'spec/karma/**/*.js'
    ],

    sprocketsPath: [
      'app/assets/javascripts',
      'vendor/assets/javascripts',
      'vendor/assets/components'
    ],

    sprocketsBundles: [
      'application.js',
      'editor.js'
    ],

    // list of files to exclude
    exclude: [
      'app/assets/javascripts/editor/app.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'app/assets/javascripts/**/*.js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    //
    // Note, not including coverage here as the instrumentation process
    // makes the code completely unreadable and undebuggable. The rake
    // test task manually enables coverage. See lib/tasks/karma_tests.rake
    //
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
    port: 9886,


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
    singleRun: true
  });
};
