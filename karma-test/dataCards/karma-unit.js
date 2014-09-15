var grunt = require('grunt');
var path = require('path');
var fs = require('fs');
var sprintf = require('sprintf');
var _ = require('lodash');

// Parse supported_browsers.json to generate BrowserStack launcher definitions.
var supportedBrowsers = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supported_browsers.json'), {encoding: 'utf8'}));
var customLaunchers = {};
_.forIn(supportedBrowsers, function(browserInstances, browserName) {
  _.each(browserInstances, function(instance) {
    instance.browserName = browserName;
    var launcherName = sprintf('bs_%(browserName)s%(version)s_%(os.name)s_%(os.version)s', instance);
    customLaunchers[launcherName] = {
      base: 'BrowserStack',
      browser: browserName,
      browser_version: instance.version,
      os: instance.os.name,
      os_version: instance.os.version
    };
  });
});

module.exports = function ( karma ) {
  karma.set({
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: '../../',

    /**
     * Configure which files should be preproccessed.
     */
    preprocessors: {
      'public/javascripts/angular/**/!(angular-leaflet-directives.js)': ['coverage'],
      '**/*.html': ['ng-html2js'],
      '**/*.json': ['ng-html2js'],
      '**/*.sass': ['sass']
    },

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/javascript-detect-element-resize/jquery.resize.js',
      'bower_components/lodash/dist/lodash.js',
      'public/javascripts/util/lodash-mixins.js',
      'public/javascripts/util/jquery-extensions.js',
      'public/javascripts/bower/jquery.dotdotdot.js',
      'bower_components/angular/angular.js',
      /*    Map-specific libraries    */
      'bower_components/leaflet/dist/leaflet.js',
      'bower_components/chroma-js/chroma.js',
      'bower_components/simple-statistics/src/simple_statistics.js',
      'app/styles/bower/leaflet.css',
      'app/styles/dataCards/testing.css',
      /* ------- */
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/d3/d3.min.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/rxjs/rx.js',
      'bower_components/rxjs/rx.binding.js',
      'bower_components/rxjs/rx.aggregates.js',
      'bower_components/rxjs/rx.time.js',
      'bower_components/jjv/lib/jjv.js',
      'bower_components/sinon-browser-only/sinon.js',
      'bower_components/moment/moment.js',
      'karma-test/TestHelpers.js',
      'karma-test/dataCards/*.js',
      'karma-test/dataCards/**/*.js',
      /*    Angular    */
      'public/javascripts/angular/common/*.js',
      'public/javascripts/angular/common/**/*.js',
      'public/javascripts/angular/dataCards/controllers.js',
      'public/javascripts/angular/dataCards/models.js',
      'public/javascripts/angular/dataCards/**/*.js',
      /*    Angular Templates    */
      'public/angular_templates/**/*.html',
      /*    Test datasets    */
      'karma-test/dataCards/test-data/**/*.json',
      /*    SASS    */
      'app/styles/dataCards/timeline-chart.sass',
      'app/styles/dataCards/column-chart.sass',
      'app/styles/dataCards/main.sass',
      'app/styles/dataCards/choropleth.sass',
      /*    Images */
      { pattern: 'public/angular_templates/images/**/*.png', watched: false,
        included: false, served: true },
      'karma-test/BrowserstackDebugHelper.js'
    ],
    exclude: [
      'public/javascripts/angular/dataCards/app.js'
    ],

    proxies: {
      '/angular_templates/images/': 'http://localhost:7019/base/public/angular_templates/images/'
    },

    browserStack: {
      username: 'socrataengineeri1',
      accessKey: 'NY7TjFt1pqdrxzoBYU4E',
      name: 'dataCards Unit Tests',
      project: 'FrontEnd'
    },

    customLaunchers: customLaunchers,

    frameworks: [ 'mocha', 'chai', 'chai-as-promised' ],
    plugins: [
      'karma-chai',
      'karma-chai-plugins',
      'karma-mocha',
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher',
      'karma-browserstack-launcher',
      'karma-coverage',
      'karma-mocha-reporter',
      'karma-ng-html2js-preprocessor',
      require('../karma-sass-preprocessor.js')
    ],

    logLevel:  'WARN',
    /**
     * How to report, by default.
     * Note, not including coverage here as the instrumentation process
     * makes the code completely unreadable and undebuggable. The rake
     * test task manually enables coverage. See lib/tasks/karma_tests.rake
     */
    reporters: ['dots'],

    coverageReporter: {
      reporters: [
        {
          type : 'html',
          dir : 'karma-test/coverage-reports/dataCards/',
          subdir: '.'
        },
        {
          type: 'text',
          dir : 'karma-test/coverage-reports/dataCards/',
          subdir: '.',
          file: 'coverage.txt'
        },
        {
          type: 'cobertura',
          dir : 'karma-test/coverage-reports/dataCards/',
          subdir: '.'
        },
        {
          type: 'text-summary'
        }
      ]
    },
    /**
     * On which port should the browser connect, on which port is the test runner
     * operating, and what is the URL path for the browser to use.
     */
    port: 7019,
    urlRoot: '/',

    /**
     * Disable file watching by default.
     */
    autoWatch: true,

    /**
     * Run once, then exit.
     */
    singleRun: true,

    /**
     * The list of browsers to launch to test ondest     * default, but other browser names include:
     * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
     *
     * Note that you can also use the executable name of the browser, like "chromium"
     * or "firefox", but that these vary based on your operating system.
     *
     * You may also leave this blank and manually navigate your browser to
     * http://localhost:9018/ when you're running tests. The window/tab can be left
     * open and the tests will automatically occur there during the build. This has
     * the aesthetic advantage of not launching a browser every time you save.
     */
    browsers: [
      'Chrome',
      'Firefox',
      'PhantomJS'
    ],

    /**
     * Increase the browser timeout for running tests in the background.
     */
    browserNoActivityTimeout: 1000 * 60 * 10,
    captureTimeout: 1000 * 60 * 10,

    /**
     * Configure html2js to compile the angular templates.
     */
    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'public'
    }
  });
};
