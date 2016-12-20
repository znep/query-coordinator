var path = require('path');

var root = path.resolve(__dirname, '../..');
var webpack = require('webpack');

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
        loaders: [
          {
            test: /\.jsx?$/,
            include: [
              path.resolve('public/javascripts/signin'),
              path.resolve('node_modules/socrata-components/common'),
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
          },
          {
            test: /\.svg$/,
            loader: 'raw-loader',
            include: path.resolve('node_modules/socrata-components/dist/fonts/svg')
          },
          {
            test: /\.(eot|woff|svg|woff2|ttf)$/,
            loader: 'url-loader?limit=100000',
            exclude: path.resolve('node_modules/socrata-components/dist/fonts/svg')
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
          fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        })
      ],
      sassLoader: {
        includePaths: [
          'node_modules/bourbon/app/assets/stylesheets',
          'node_modules/bourbon-neat/app/assets/stylesheets',
          'node_modules/breakpoint-sass/stylesheets',
          'node_modules/modularscale-sass/stylesheets',
          'node_modules/normalize.css',
          'node_modules/socrata-components',
          'node_modules/socrata-components/styles',
          'node_modules/socrata-components/styles/variables',
          'node_modules/socrata-components/dist/fonts',
          'node_modules/react-input-range/dist'
        ]
      },
      resolve: {
        alias: {
          icons: path.resolve('node_modules/socrata-components/dist/fonts/svg'),
          socrataCommon: path.resolve('node_modules/socrata-components/common')
        },
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/signin'),
          path.resolve('karma/signin')
        ]
      }
    },

    mochaReporter: {
      showDiff: true
    },

    client: {
      captureConsole: true
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
