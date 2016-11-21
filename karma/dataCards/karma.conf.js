var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var projectRootDir = path.resolve(__dirname, '../..');
var templateDir = path.resolve(projectRootDir, 'public/angular_templates');

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/js-polyfills/timing.js',
      'public/javascripts/util/polyfills.js',
      'public/javascripts/plugins/modernizr.js',
      'public/javascripts/plugins/squire.js',
      'public/javascripts/plugins/url.js',

      // https://github.com/karma-runner/karma/issues/1532
      { pattern: 'public/images/dataCards/**/*.???', watched: false, included: false, served: true },
      { pattern: 'public/stylesheets/images/common/*', watched: false, included: false, served: true },

      // Tests
      'karma/dataCards/index.js'
    ],

    proxies: {
      '/images/dataCards': `http://localhost:${karma.port}/base/public/images/dataCards`,
      '/javascripts/plugins/': `http://localhost:${karma.port}/base/public/javascripts/plugins/`,
      '/stylesheets/images/common/': `http://localhost:${karma.port}/base/public/stylesheets/images/common/`
    },

    preprocessors: {
      'karma/dataCards/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'chai-jquery', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      externals: {
        jquery: 'jQuery'
      },
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel'
          },
          {
            test: /\.html$/,
            loaders: [
              'ngtemplate?requireAngular&module=dataCards&relativeTo=' + templateDir,
              'html'
            ]
          },
          {
            test: /\.scss|\.css$/,
            loader: 'style!css!autoprefixer-loader!sass'
          },
          {
            test: /\.png$/,
            loader: 'url-loader?limit=100000'
          },
          {
            test: /\.json$/,
            loader: 'json-loader'
          },
          {
            test: /angular\-mocks/,
            loader: 'imports-loader',
            query: { angular: 'angular' }
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      resolve: {
        alias: {
          angular_templates: templateDir,
          'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
          'socrata.utils': 'socrata-utils/dist/socrata.utils.js',
          'lodash': path.resolve(projectRootDir, 'node_modules/lodash'),
          'leaflet': path.resolve(projectRootDir, 'node_modules/leaflet')
        },
        root: [ path.resolve('.') ],
        modulesDirectories: [ 'node_modules' ]
      },
      sassLoader: {
        includePaths: ['app/styles']
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    mochaReporter: {
      showDiff: true
    },

    colors: true,
    logLevel: 'INFO',

    browsers: [
      'Chrome',
      'Firefox',
      'PhantomJS'
    ],
    browserNoActivityTimeout: 1000 * 55,
    browserDisconnectTimeout: 1000 * 10,
    browserDisconnectTolerance: 5,
    phantomjsLauncher: {
      options: {
        viewportSize: {
          width: 1024,
          height: 768
        }
      }
    }
  });
};
