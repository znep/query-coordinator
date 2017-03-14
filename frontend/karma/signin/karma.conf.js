var path = require('path');

var root = path.resolve(__dirname, '../..');
var webpack = require('webpack');
var common = require(path.resolve(root, 'config/webpack/common'));

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/signin/index.js'
    ],

    preprocessors: {
      'karma/signin/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        preLoaders: [
          ...common.getStyleguidePreLoaders()
        ],
        loaders: [
          {
            test: /\.jsx?$/,
            include: [
              path.resolve('public/javascripts/signin'),
              path.resolve('karma/signin')
            ],
            loader: 'babel',
            query: {
              presets: ['react', 'es2015']
            }
          },
          {
            test: /\.scss$/,
            loaders: [
              'style',
              'css?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
              'sass'
            ]
          }
        ]
      },
      externals: {
        'cheerio': 'window',
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
      },
      plugins: [
        new webpack.ProvidePlugin({
          Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
          fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
          $: 'jquery',
          jQuery: 'jquery'
        })
      ],
      sassLoader: {
        includePaths: [
          ...common.getStyleguideIncludePaths()
        ]
      },
      resolveLoader: {
        modulesDirectories: [ path.resolve(root, 'node_modules') ]
      },
      resolve: {
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/signin'),
          path.resolve('karma/signin')
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    mochaReporter: {
      showDiff: true
    },

    client: {
      captureConsole: true
    },

    colors: true,
    logLevel: 'INFO',

    browsers: ['PhantomJS'],
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
