/* eslint-env node */

// Karma configuration for common code.
var path = require('path');

var root = path.resolve(__dirname, '../..');
// TODO Move base webpack config from frontend/webpack into common, then use here.
var webpackConfig = {
  context: __dirname,
  module: {
    loaders: [
      {
        loaders: [require.resolve('style-loader'), require.resolve('css-loader'), require.resolve('sass-loader')],
        test: /\.s?css$/
      },
      {
        loader: require.resolve('raw-loader'),
        test: /\.svg$/,
        include: `${root}/common/resources/fonts/svg`
      },
      {
        test: /\.jsx?$/,
        loader: require.resolve('babel-loader'),
        exclude: /node_modules/,
        query: {
          presets: [
            'babel-preset-es2015', 'babel-preset-react'
          ].map(require.resolve),
          plugins: [
            'babel-plugin-transform-object-rest-spread',
            'babel-plugin-rewire'
          ].map(require.resolve)
        }
      }
    ]
  },
  resolve: {
    root: [
      root,
      // Let tests import modules (i.e, import FeatureFlags from 'common/FeatureFlags')
      path.resolve('../../'),

      // TODO: This is a compatibility shim that was added during the
      // styleguide->platform-ui migration to avoid having to update
      // the import paths of a lot of test files. This will be removed
      // when we do EN-14559.
      path.resolve('../../common'),

      // Allow code under test to require dependencies in karma_config's package.json.
      '../karma_config/node_modules'
    ],
    modulesDirectories: [ path.resolve(root, 'packages/socrata-components/node_modules') ]
  },
  devtool: 'inline-source-map',
  sassLoader: {
    includePaths: [
      `${root}/common/authoring_workflow`
    ]
  }
};

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai-dom', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/sinon/pkg/sinon.js',
      '../spec/index.js'
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // Load specs through webpack.
      '../spec/index.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    },

    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },
    browsers: ['PhantomJS'],
    phantomjsLauncher: {
      options: {
        viewportSize: {
          width: 1024,
          height: 768
        }
      }
    },
    browserNoActivityTimeout: 1000 * 55,
    browserDisconnectTimeout: 1000 * 10,
    browserDisconnectTolerance: 5,
    customLaunchers: {
      ChromeNoSandboxHeadless: {
        base: 'Chrome',
        flags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--remote-debugging-port=9222'
        ]
      }
    }
  });
};
