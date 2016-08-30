var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var projectRootDir = path.resolve(__dirname, '../..');
var templateDir = path.resolve(projectRootDir, 'public/angular_templates');

var packageJson = require(path.resolve(projectRootDir, 'package.json'));
var dataCardsWebpackExternals = packageJson.config.dataCardsWebpackExternals;

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [

      // Phantom polyfills
      'public/javascripts/bower/url.js',
      'public/javascripts/bower/requestAnimationFrame.js',
      'public/javascripts/util/polyfills.js',

      // Dependencies
      // TODO move to npm, remove from webpack externals, and require them where needed.
      'public/javascripts/bower/jquery.js',
      'public/javascripts/bower/jquery.dotdotdot.js',
      'public/javascripts/bower/jquery.resize.js',
      'public/javascripts/bower/angular.min.js',
      'public/javascripts/bower/angular-sanitize.js',
      'public/javascripts/bower/angular-ui-router.js',
      'public/javascripts/bower/elastic.js',
      'public/javascripts/bower/rx.js',
      'public/javascripts/bower/rx.async.js',
      'public/javascripts/bower/rx.aggregates.js',
      'public/javascripts/bower/rx.time.js',
      'public/javascripts/bower/rx.binding.js',
      'public/javascripts/bower/rx.angular.js',
      'public/javascripts/bower/jjv.js',
      'public/javascripts/bower/d3.js',
      'public/javascripts/bower/leaflet.js',
      'public/javascripts/bower/moment.js',
      'public/javascripts/plugins/modernizr.js',
      'public/javascripts/plugins/squire.js',

      'karma/dataCards/test-data/**/*.json',
      // https://github.com/karma-runner/karma/issues/1532
      { pattern: 'public/images/dataCards/**/*.???', watched: false, included: false, served: true },
      { pattern: 'public/stylesheets/images/common/*', watched: false, included: false, served: true },

      // Tests
      'karma/dataCards/index.js'
    ],

    proxies: {
      '/images/dataCards': 'http://localhost:7019/base/public/images/dataCards',
      '/javascripts/plugins/': 'http://localhost:7019/base/public/javascripts/plugins/',
      '/stylesheets/images/common/': 'http://localhost:7019/base/public/stylesheets/images/common/'
    },

    preprocessors: {
      'karma/dataCards/index.js': ['webpack', 'sourcemap'],
      'karma/dataCards/test-data/**/*.json': ['ng-html2js']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'chai-jquery', 'sinon-chai'],

    reporters: ['dots'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      externals: dataCardsWebpackExternals,
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
              'ngtemplate?relativeTo=' + templateDir,
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
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      resolve: {
        alias: {
          angular_templates: templateDir,
          'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
          'socrata.utils': 'socrata-utils/dist/socrata.utils.js',
          '_': 'lodash'
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

    ngHtml2JsPreprocessor: {
      stripPrefix: 'public',
      moduleName: 'dataCards.templates'
    },

    port: 7019,
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
