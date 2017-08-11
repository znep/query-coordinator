/* eslint-env node */

// Karma configuration for common code.
var path = require('path');
var nodeResolve = require.resolve;
var platformUiRoot = path.resolve(__dirname, '../..');

// TODO Move base webpack config from frontend/webpack into common, then use here.
var webpackConfig = {
  context: __dirname,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: nodeResolve('babel-loader'),
        exclude: /node_modules/,
        query: {
          cacheDirectory: './babelCache',
          presets: [
            'babel-preset-es2015', 'babel-preset-react'
          ].map(nodeResolve),
          plugins: [
            'babel-plugin-transform-object-rest-spread',
            'babel-plugin-rewire'
          ].map(nodeResolve)
        }
      },
      {
        test: /\.svg$/,
        loader: nodeResolve('raw-loader'),
        include: `${platformUiRoot}/common/resources/fonts/svg`
      },
      {
        test: /\.(eot|woff|svg|woff2|ttf)$/,
        loader: {
          loader: nodeResolve('url-loader'),
          query: 'limit=100000'
        },
        exclude: `${platformUiRoot}/common/resources/fonts/svg`
      },
      {
        test: /\.(css|scss)$/,
        loaders: [
          nodeResolve('style-loader'),
          // You may be tempted to split the query and loader path into an object with `query` and
          // `loader` properties, a la Webpack 2.
          // Since we're using Webpack 1, that will not work. If multiple loaders are to be specified,
          // they must be given a query via a ? in their name after their full path
          // (provided by nodeResolve).
          nodeResolve('css-loader') + '?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          nodeResolve('autoprefixer-loader'),
          nodeResolve('sass-loader')
        ],
        exclude: /node_modules|visualizations/
      },
      {
        // Special style loader for visualizations - they can't
        // tolerate autoprefixer, but the styleguide styles _require_
        // autoprefixer (for phantomjs compatibility).
        test: /\.(css|scss)$/,
        loaders: [
          nodeResolve('style-loader'),
          nodeResolve('css-loader'),
          nodeResolve('sass-loader')
        ],
        include: /visualizations/
      },
      {
        test: /\.json$/,
        loaders: [
          nodeResolve('json-loader')
        ]
      },
      {
        test: /\.yml$/,
        loaders: [
          nodeResolve('json-loader'),
          nodeResolve('yaml-loader')
        ]
      }
    ]
  },
  sassLoader: {
    // Sets the search path for @include directives SPECIFICALLY in *.scss files.
    includePaths: [
      `${platformUiRoot}/node_modules/bourbon/app/assets/stylesheets`,
      `${platformUiRoot}/node_modules/bourbon-neat/app/assets/stylesheets`,
      `${platformUiRoot}/node_modules/breakpoint-sass/stylesheets`,
      `${platformUiRoot}/node_modules/modularscale-sass/stylesheets`,
      `${platformUiRoot}/node_modules/normalize.css`,
      `${platformUiRoot}/node_modules/react-input-range/dist`,
      `${platformUiRoot}/node_modules/react-datepicker/dist`,
      `${platformUiRoot}/common/authoring_workflow`,
      `${platformUiRoot}/common`,
      platformUiRoot
    ]
  },
  resolve: {
    root: [
      platformUiRoot,

      // TODO: This is a compatibility shim that was added during the
      // styleguide->platform-ui migration to avoid having to update
      // the import paths of a lot of test files. This will be removed
      // when we do EN-14559.
      `${platformUiRoot}/common`,

      // Allow code under test to require dependencies in karma_config's package.json.
      `${platformUiRoot}/common/karma_config/node_modules`
    ],
    modulesDirectories: [ path.resolve(platformUiRoot) ]
  },
  externals: {
    'jsdom': 'window',
    'cheerio': 'window',
    'react/addons': true,
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true,
    'react/lib/ReactTestUtils': true
  },
  devtool: 'inline-source-map'
};

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai-dom', 'chai', 'sinon', 'intl-shim'],

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

    browsers: ['ChromeNoSandboxHeadless'],
    captureTimeout: 900000,
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
