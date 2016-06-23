var path = require('path');

var root = path.resolve(__dirname, '../..');
var webpack = require('webpack');

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/adminGoals/index.js'
    ],

    preprocessors: {
      'karma/adminGoals/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
              presets: ['react', 'es2015']
            }
          },
          {
            test: /\.scss|\.css$/,
            loader: 'style!css!autoprefixer-loader!sass'
          },
          {
            test: /\.svg/,
            loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
          },
          {
            test: /\.png$/,
            loader: 'url-loader?limit=100000'
          }
        ]
      },
      resolve: {
        alias: {},
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/adminGoals'),
          path.resolve('karma/adminGoals')
        ]
      },
      plugins: [
        new webpack.ProvidePlugin({
          Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
          fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        })
      ]
    },

    webpackMiddleware: {
      noInfo: true
    },

    port: 7019,
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
