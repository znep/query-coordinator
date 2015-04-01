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

var indexOfGroupsSwitch = _.indexOf(process.argv, '--exclude-groups');
// String names of groups to include.
var groupsToExclude = _.map(
  indexOfGroupsSwitch >= 0 ? process.argv[indexOfGroupsSwitch + 1].split(',') : [],
  function(group) { return group.trim(); });

function isTestGroupIncluded(group) {
  return _.indexOf(groupsToExclude, group) < 0;
}

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
      /* The order of this matters. */

      /* EXTERNAL PRODUCTION DEPENDENCIES
       * (no test dependencies) */

      /* Libraries which Angular binds against - they
       * must be loaded before Angular. */
      'bower_components/jquery/dist/jquery.js',

      /* Libraries which do not depend on Angular. */
      'bower_components/js-polyfills/url.js',
      'bower_components/lodash/dist/lodash.js',
      'public/javascripts/util/polyfills.js',
      'public/javascripts/util/lodash-mixins.js',
      'public/javascripts/util/jquery-extensions.js',
      'public/javascripts/bower/jquery.dotdotdot.js',
      'bower_components/showdown/src/showdown.js',
      'bower_components/javascript-detect-element-resize/jquery.resize.js',
      'bower_components/jjv/lib/jjv.js',
      'bower_components/d3/d3.min.js',
      'bower_components/moment/moment.js',
      'bower_components/native-promise-only/lib/npo.src.js',
      'bower_components/requestAnimationFrame-polyfill/requestAnimationFrame.js',
      'public/javascripts/plugins/modernizr.js',
      {pattern: 'public/javascripts/plugins/squire.js', included: false},
      'bower_components/rxjs/rx.js',
      'bower_components/rxjs/rx.async.js',
      'bower_components/rxjs/rx.aggregates.js',
      'bower_components/rxjs/rx.time.js',
      'bower_components/rxjs/rx.binding.js',

      'public/javascripts/plugins/leaflet.js',
      'app/styles/leaflet.css',
      'bower_components/chroma-js/chroma.js',
      'bower_components/simple-statistics/src/simple_statistics.js',
      'public/javascripts/util/typed-arrays.js',
      'public/javascripts/bower/pbf.min.js',
      'public/javascripts/bower/vectortile.min.js',

      /* Angular itself */
      'bower_components/angular/angular.js',

      /* Libraries needing Angular */
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-markdown-directive/markdown.js',

      /* END OF PRODUCT DEPENDENCIES */

      /* TEST-ONLY EXTERNAL DEPENDENCIES */

      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/sinon-browser-only/sinon.js',

      /* END OF EXTERNAL DEPENDENCIES
       * OUR CODE BELOW */

      /* dataCards ITSELF */
      'public/javascripts/angular/common/*.js',
      'public/javascripts/angular/common/**/*.js',

      'karma-test/helpers/TestHelpers.js', // Requirement for mockModuleDefinitions.
      'karma-test/dataCards/mockModuleDefinitions.js', // Mock out module('dataCards').

      'public/javascripts/angular/dataCards/controllers.js',
      'public/javascripts/angular/dataCards/models.js',
      'public/javascripts/angular/dataCards/**/*.js',

      'public/angular_templates/**/*.html',
      'app/styles/dataCards/*.sass',
      { pattern: 'public/stylesheets/images/**/*.{jpg,png}', watched: false, included: false, served: true },

      /* TEST MOCKS */

      /* Test datasets */
      'karma-test/dataCards/test-data/**/*.json',
      /* Mock app assets */
      'app/styles/dataCards/testing.css',
      /* Images */
      { pattern: 'public/stubs/images/*.png', watched: false, included: false, served: true },

      /* THE TESTS THEMSELVES */
      'karma-test/helpers/ServerMocks.js',
      'karma-test/dataCards/*.js',
      /* IMPORTANT: If you add/remove/change test groups,
       * please update at the constant TEST_GROUPS in karma_tests.rake.
       * If you don't, your tests may be run multiple times per run.
       */
      { pattern: 'karma-test/dataCards/controllers/*.js', included: isTestGroupIncluded('controllers') },
      { pattern: 'karma-test/dataCards/directives/*[cC]horoplethTest.js', included: isTestGroupIncluded('directives-maps') },
      { pattern: 'karma-test/dataCards/directives/*[fF]eatureMapTest.js', included: isTestGroupIncluded('directives-maps') },
      { pattern: 'karma-test/dataCards/directives/cardLayoutTest.js', included: isTestGroupIncluded('directives-card-layout') },
      { pattern: 'karma-test/dataCards/directives/*.js', included: isTestGroupIncluded('directives-other') },
      { pattern: 'karma-test/dataCards/filters/*.js', included: isTestGroupIncluded('filters') },
      { pattern: 'karma-test/dataCards/services/*.js', included: isTestGroupIncluded('services') },
      { pattern: 'karma-test/dataCards/models/*.js', included: isTestGroupIncluded('models') },
      { pattern: 'karma-test/dataCards/util/*.js', included: isTestGroupIncluded('util') },
      { pattern: 'karma-test/dataCards/**/*.js', included: true } // Safety net - runs any tests not explicitly listed in a batch.
    ],

    exclude: [
      // This file is mocked out by mockModuleDefinitions.
      'public/javascripts/angular/dataCards/app.js'
    ],

    proxies: {
      '/stubs/images/': 'http://localhost:7019/base/public/stubs/images/',
      '/javascripts/plugins/': 'http://localhost:7019/base/public/javascripts/plugins/',
      '/stylesheets/images/': 'http://localhost:7019/base/public/stylesheets/images/',
      '/images/dataCards/customize/': 'http://localhost:7019/base/public/images/dataCards/customize/'
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

    frameworks: [ 'mocha', 'chai', 'chai-as-promised', 'chai-jquery', 'sinon-chai' ],
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
