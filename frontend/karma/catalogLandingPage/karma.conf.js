var _ = require('lodash');
var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');

var webpackCommon = require('../../config/webpack/common');
var webpackBase = require('../../config/webpack/base'); // TODO: Use catalog-landing-page.config.js
var webpackConfig = require('../../config/webpack/catalog-landing-page.config.js'); // TODO: Use catalog-landing-page.config.js

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/catalogLandingPage/index.js'
    ],

    preprocessors: {
      'karma/catalogLandingPage/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: _.defaultsDeep({
      cache: true,
      devtool: 'inline-source-map',
      plugins: [ new WebpackFailurePlugin() ],
      externals: {
        jquery: 'jQuery'
      },
      resolve: webpackCommon.getStandardResolve([
        'karma/catalogLandingPage',
        'public/javascripts/catalogLandingPage'
      ])
    }, webpackBase),

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
