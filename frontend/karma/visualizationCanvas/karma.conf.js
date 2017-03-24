var path = require('path');
var webpack = require('webpack');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');
var common = require(path.resolve(root, 'config/webpack/common'));

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'public/javascripts/jquery-2.2.4.js',
      'karma/visualizationCanvas/index.js'
    ],

    preprocessors: {
      'karma/visualizationCanvas/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      externals: {
        jquery: 'jQuery'
      },
      module: {
        preLoaders: [
          ...common.getStyleguidePreLoaders()
        ],
        loaders: [
          {
            test: /\.jsx?$/,
            include: [
              path.resolve(root, 'public/javascripts'),
              path.resolve(root, 'node_modules/socrata-components/common'),
              path.resolve(root, 'karma/visualizationCanvas')
            ],
            loader: 'babel'
          }
        ]
      },
      plugins: [
        new WebpackFailurePlugin(),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      resolveLoader: {
        modulesDirectories: [ path.resolve(root, 'node_modules') ]
      },
      resolve: {
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/visualizationCanvas'),
          path.resolve('karma/visualizationCanvas')
        ]
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