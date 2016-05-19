var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var projectRoot = path.resolve(__dirname, '../..');

module.exports = function ( karma ) {
  karma.set({
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: '../../',

     preprocessors: {
       'karma/oldUx/**/*-test.js': ['webpack'],
       'karma/helpers/chai-dom-assertions.js': ['webpack']
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
      'bower_components/moment/moment.js',

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
      'public/javascripts/screens/admin-jobs.js',
      'public/javascripts/screens/admin-show-job.js',

      // Utilities/Libraries
      'public/javascripts/plugins/html4-defs.js',
      'public/javascripts/plugins/html-sanitizer.js',
      'public/javascripts/plugins/html2markdown.js',
      'public/javascripts/component/util/html-sanitizer-utils.js',

      // Test Configuration
      'karma/chai-configuration.js',

      // Test Files
      'karma/oldUx/**/*.js',
      { pattern: 'public/stylesheets/images/**/*.+{gif,jpg,png}', watched: false, included: false, served: true } // https://github.com/karma-runner/karma/issues/1532
    ],

    proxies: {
      '/stylesheets/images/': 'http://localhost:7019/base/public/stylesheets/images/'
    },

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
      'karma-mocha-reporter',
      'karma-webpack'
    ],

    logLevel:  'WARN',

    /**
     * How to report, by default.
     */
    reporters: ['dots'],

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
    webpack: {
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel'
          }
        ]
      },
      resolve: {
        modulesDirectories: [ 'node_modules', 'bower_components', projectRoot + '/public/javascripts/src' ]
      }

    },
    webpackMiddleware: {
      noInfo: true
    }
  });
};
