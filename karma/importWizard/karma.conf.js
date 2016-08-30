var path = require('path');
var webpack = require('webpack');

var root = path.resolve(__dirname, '../..');

module.exports = function(karma) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/importWizard/index.js'
    ],

    preprocessors: {
      'karma/importWizard/index.js': ['webpack', 'sourcemap']
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
            exclude: /(node_modules)/,
            loader: 'babel',
            query: { compact: false }
          }
        ]
      },
      resolve: {
        alias: {
          '_': 'lodash',
          'jquery.awesomereorder': path.resolve(root, 'public/javascripts/plugins/jquery.awesomereorder.js')
        },
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/importWizard'),
          path.resolve('karma/importWizard')
        ]
      },
      externals: {
        'datasetCategories': 'datasetCategories',
        'importableTypes': 'importableTypes',
        'enabledModules': 'enabledModules',
        'customMetadataSchema': 'customMetadataSchema',
        'licenses': 'licenses',
        'blistLicenses': 'blistLicenses'
      },
      plugins: [
        new webpack.ProvidePlugin({
          Promise: 'imports?this=>global!exports?global.Promise!es6-promise'
        })
      ]
    },

    webpackMiddleware: {
      noInfo: true
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
