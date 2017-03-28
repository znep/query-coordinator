var _ = require('lodash');
var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');
var webpackBase = require('../../config/webpack/base');
var webpackCommon = require('../../config/webpack/common');

module.exports = function ( karma ) {
  karma.set({
    singleRun: true,

    files: [
      'index.js'
    ],

    preprocessors: {
      'index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: _.defaultsDeep({
      cache: true,
      devtool: 'inline-source-map',
      plugins: [ new WebpackFailurePlugin() ],
      resolve: webpackCommon.getStandardResolve([ 'karma/common', 'public/javascripts/common' ])
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
