var path = require('path');

var projectRootDir = path.resolve(__dirname, '../..');
var templateDir = path.resolve(projectRootDir, 'public/angular_templates');

var packageJson = require(path.resolve(projectRootDir, 'package.json'));
var dataLensWebpackExternals = packageJson.config.dataLensWebpackExternals;

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [

      // Phantom polyfills
      'bower_components/js-polyfills/url.js',
      'bower_components/requestAnimationFrame-polyfill/requestAnimationFrame.js',
      'public/javascripts/util/polyfills.js',

      // Dependencies
      // TODO move to npm, remove from webpack externals, and require them where needed.
      'bower_components/jquery/dist/jquery.js',
      'public/javascripts/bower/jquery.dotdotdot.js',
      'bower_components/javascript-detect-element-resize/jquery.resize.js',
      'bower_components/lodash-compat/lodash.js',
      'public/javascripts/util/jquery-extensions.js',
      'public/javascripts/util/lodash-mixins.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-elastic/elastic.js',
      'bower_components/rxjs/dist/rx.js',
      'bower_components/rxjs/dist/rx.async.js',
      'bower_components/rxjs/dist/rx.aggregates.js',
      'bower_components/rxjs/dist/rx.time.js',
      'bower_components/rxjs/dist/rx.binding.js',
      'bower_components/rxjs/dist/rx.virtualtime.js',
      'bower_components/rxjs/dist/rx.testing.js',
      'bower_components/angular-rx/dist/rx.angular.js',
      'bower_components/jjv/lib/jjv.js',
      'bower_components/d3/d3.min.js',
      'bower_components/leaflet/dist/leaflet-src.js',
      'bower_components/moment/moment.js',
      'public/javascripts/plugins/modernizr.js',
      'public/javascripts/plugins/squire.js',
      'public/javascripts/bower/socrata.utils.js',

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
      externals: dataLensWebpackExternals,
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
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
      resolve: {
        alias: {
          angular_templates: templateDir
        },
        root: [ path.resolve('.') ],
        modulesDirectories: [ 'node_modules', 'bower_components' ]
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
