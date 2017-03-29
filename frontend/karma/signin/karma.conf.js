var webpack = require('webpack');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'signin.config.js',
  [ 'karma/signin' ]
);
webpackConfig.externals = {
  'cheerio': 'window',
  'react/addons': true,
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': true
};
webpackConfig.plugins.push(
  new webpack.ProvidePlugin({
    Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
    fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
    $: 'jquery',
    jQuery: 'jquery'
  })
);


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

    webpack: webpackConfig,

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
