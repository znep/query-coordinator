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

var startSauceConnect = _.contains(['true', '1', 1], process.env.SAUCE_START_SAUCE_CONNECT);
var tunnelIdentifier = process.env.SAUCE_TUNNEL_IDENTIFIER || undefined;

module.exports = function ( karma ) {
  karma.set({
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: '../../',

     preprocessors: {
      'public/javascripts/**/!(jquery-1.7.1.js)': ['coverage']
    },

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      /* The order of this matters. */

      // Libraries
      'public/javascripts/jquery-1.7.1.js',
      'public/javascripts/plugins/lodash.js',
      'bower_components/sinon-browser-only/sinon.js',
      'bower_components/react/react-with-addons.js',
      'bower_components/react/react-dom.js',

      /* END OF EXTERNAL DEPENDENCIES
       * OUR CODE BELOW */

      'karma/helpers/chai-dom-assertions.js',

      /* Old UX */
      // Began implementing this for dataset-show-test, but its dependencies were breaking
      // many other tests, so leaving it out for now.
      'public/javascripts/util/namespace.js',
      'public/javascripts/util/util.js',
      'public/javascripts/plugins/inheritance.js',
      'public/javascripts/util/base-model.js',
      'public/javascripts/util/socrata-server.js',
      'public/javascripts/util/dataset/dataset.js',
      'public/javascripts/util/dataset/column-container.js',
      'public/javascripts/util/dataset/row-set.js',
      'public/javascripts/util/view-cache.js',
      'public/javascripts/util/filter.js',
      // 'public/javascripts/controls/base-control.js',
      // 'public/javascripts/controls/full-screen.js',
      // 'public/javascripts/controls/dataset-controls.js',
      // 'public/javascripts/controls/render-type-manager.js',
      // 'public/javascripts/controls/grid-sidebar.js',
      // 'public/javascripts/screens/dataset-show.js',
      'public/javascripts/dist/components/utils.js',
      'public/javascripts/dist/components/socrata-title-tip-wrapper.js',
      'public/javascripts/dist/components/loading-button.js',
      'public/javascripts/dist/components/*.js',
      'public/javascripts/dist/components/georegions/*.js',
      'public/javascripts/dist/**/*.js',

      // Utilities/Libraries
      'public/javascripts/plugins/html4-defs.js',
      'public/javascripts/plugins/html-sanitizer.js',
      'public/javascripts/plugins/html2markdown.js',
      'public/javascripts/component/util/html-sanitizer-utils.js',

      // Test Configuration
      'karma/chai-configuration.js',

      // Test Files
      'karma/oldUx/**/*.js',
      { pattern: 'public/stylesheets/images/**/*.{gif,jpg,png}', watched: false, included: false, served: true } // https://github.com/karma-runner/karma/issues/1532

    ],

    proxies: {
      '/stylesheets/images/': 'http://localhost:7019/base/public/stylesheets/images/'
    },

    sauceLabs: {
      testName: 'oldUx Unit Tests',
      username: 'socrata-saucelabs',
      accessKey: '9207e751-711a-4ed0-940a-229a42c06bcc',
      tunnelIdentifier: tunnelIdentifier,
      startConnect: startSauceConnect
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
      'karma-mocha-reporter'
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
          dir : 'karma/coverage-reports/oldUx/',
          subdir: '.'
        },
        {
          type: 'text',
          dir : 'karma/coverage-reports/oldUx/',
          subdir: '.',
          file: 'coverage.txt'
        },
        {
          type: 'cobertura',
          dir : 'karma/coverage-reports/oldUx/',
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
    browserNoActivityTimeout: 1000 * 50,
    browserDisconnectTimeout: 1000 * 10,
    browserDisconnectTolerance: 5,
    captureTimeout: 1000 * 80,

  });
};
