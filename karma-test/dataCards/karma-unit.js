var grunt = require('grunt');
module.exports = function ( karma ) {
  karma.set({
    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: '../../',

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/javascript-detect-element-resize/jquery.resize.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/d3/d3.min.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/rxjs/rx.js',
      'bower_components/rxjs/rx.binding.js',
      'bower_components/rxjs/rx.aggregates.js',
      'bower_components/jjv/lib/jjv.js',
      'bower_components/sinon-browser-only/sinon.js',
      'bower_components/leaflet/dist/leaflet.js',
      'karma-test/testHelpers.js',
      'karma-test/dataCards/*.js',
      'karma-test/dataCards/**/*.js',
      'public/javascripts/angular/common/*.js',
      'public/javascripts/angular/common/**/*.js',
      'public/javascripts/angular/dataCards/controllers.js',
      'public/javascripts/angular/dataCards/models.js',
      'public/javascripts/angular/dataCards/**/*.js'
    ],
    exclude: [
      'public/javascripts/angular/dataCards/app.js',
    ],

    frameworks: [ 'mocha', 'chai', 'chai-as-promised' ],
    plugins: [ 'karma-chai', 'karma-chai-plugins', 'karma-mocha', 'karma-firefox-launcher', 'karma-chrome-launcher', 'karma-phantomjs-launcher', 'karma-coverage'],

    logLevel:  'WARN',
    /**
     * How to report, by default.
     */
    reporters: ['dots', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'karma-test/dataCards/coverage/'
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
    ]
  });
};
