var grunt = require('grunt');
var path = require('path');
var fs = require('fs');
var sprintf = require('sprintf');
var _ = require('lodash');

// Parse supported_browsers.json to generate SauceLabs launcher definitions.
var supportedBrowsers = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supported_browsers.json'), {encoding: 'utf8'}));
var customLaunchers = {};
_.forIn(supportedBrowsers, function(browserInstances, browserName) {
  _.each(browserInstances, function(instance) {
    instance.browserName = browserName;
    var launcherName = sprintf('saucelabs %(browserName)s %(version)s %(platform)s', instance).toLowerCase();
    customLaunchers[launcherName] = {
      base: 'SauceLabs',
      browserName: browserName,
      version: instance.version,
      platform: instance.platform
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
      'bower_components/showdown/src/showdown.js',
      'bower_components/angular/angular.js',
      /*    Map-specific libraries    */
      'public/javascripts/plugins/leaflet.js',
      'bower_components/chroma-js/chroma.js',
      'bower_components/simple-statistics/src/simple_statistics.js',
      'public/javascripts/util/typed-arrays.js',
      'public/javascripts/bower/pbf.min.js',
      'public/javascripts/bower/vectortile.min.js',
      'app/styles/leaflet.css',
      'app/styles/dataCards/testing.css',
      /* ------- */
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/d3/d3.min.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/rxjs/rx.js',
      'bower_components/rxjs/rx.async.js',
      'bower_components/rxjs/rx.aggregates.js',
      'bower_components/rxjs/rx.time.js',
      'bower_components/rxjs/rx.binding.js',
      'bower_components/jjv/lib/jjv.js',
      'bower_components/sinon-browser-only/sinon.js',
      'bower_components/moment/moment.js',
      'bower_components/native-promise-only/lib/npo.src.js',
      'bower_components/requestAnimationFrame-polyfill/requestAnimationFrame.js',
      'public/javascripts/plugins/modernizr.js',
      'karma-test/helpers/TestHelpers.js',
      'karma-test/helpers/ServerMocks.js',
      'karma-test/dataCards/*.js',
      'karma-test/dataCards/**/*.js',
      /*    Angular    */
      'public/javascripts/angular/common/*.js',
      'public/javascripts/angular/common/**/*.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-markdown-directive/markdown.js',
      'public/javascripts/angular/dataCards/controllers.js',
      'public/javascripts/angular/dataCards/models.js',
      'public/javascripts/angular/dataCards/**/*.js',
      /*    Angular Templates    */
      'public/angular_templates/**/*.html',
      /*    Test datasets    */
      'karma-test/dataCards/test-data/**/*.json',
      /*    SASS    */
      'app/styles/dataCards/*.sass',
      /*    Images */
      { pattern: 'public/stubs/images/*.png', watched: false, included: false, served: true }
    ],
    exclude: [
      'public/javascripts/angular/dataCards/app.js'
    ],

    proxies: {
      '/stubs/images/': 'http://localhost:7019/base/public/stubs/images/'
    },

    sauceLabs: {
      testName: 'dataCards Unit Tests',
      username: 'socrata-saucelabs',
      accessKey: '9207e751-711a-4ed0-940a-229a42c06bcc'
    },

    customLaunchers: customLaunchers,

    // Options for phantomJS launcher
    phantomjsLauncher: {
      options: {
        viewportSize: {
          width: 1024,
          height: 768
        }
      }
    },

    frameworks: [ 'mocha', 'chai', 'chai-as-promised' ],
    plugins: [
      'karma-chai',
      'karma-chai-plugins',
      'karma-mocha',
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher',
      'karma-sauce-launcher',
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
    reporters: ['dots', 'saucelabs'],

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
     * Enable file watching by default.
     */
    autoWatch: true,

    /**
     * Run once, then exit.
     */
    singleRun: true,

    /**
     * The list of browsers to launch to test by default, but other browser names include:
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
    browserNoActivityTimeout: 1000 * 55,
    browserDisconnectTimeout: 1000 * 10,
    browserDisconnectTolerance: 5,
    captureTimeout: 1000 * 80,


    /**
     * Configure html2js to compile the angular templates.
     */
    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'public'
    }
  });
};
