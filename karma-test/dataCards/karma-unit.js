var grunt = require('grunt');
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
      'public/javascripts/util/jquery_extensions.js',
      'public/javascripts/bower/jquery.dotdotdot.js',
      /*    Angular Templates    */
      'public/angular_templates/**/*.html',
      /*    Test datasets    */
      'karma-test/dataCards/test-data/**/*.json',
      /*    SASS    */
      'app/styles/dataCards/column-chart.sass',
      'app/styles/dataCards/main.sass',
      'app/styles/dataCards/choropleth.sass',
    ],
    exclude: [
      'public/javascripts/angular/dataCards/app.js'
    ],

    frameworks: [ 'mocha', 'chai', 'chai-as-promised' ],
    plugins: [
      'karma-chai',
      'karma-chai-plugins',
      'karma-mocha',
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher',
      'karma-coverage',
      'karma-mocha-reporter',
      'karma-ng-html2js-preprocessor',
      require('../karma-sass-preprocessor.js')
    ],

    logLevel:  'WARN',
    /**
     * How to report, by default.
     */
    reporters: ['dots', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'karma-test/coverage-reports/dataCards/'
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
    browserNoActivityTimeout: 60000,

    /**
     * Configure html2js to compile the angular templates.
     */
    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'public'
    }
  });
};
