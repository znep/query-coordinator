var path = require('path');
var webpack = require(path.resolve('.', 'config/webpack.config.js'));

module.exports = function(config) { //eslint-disable-line no-undef

  config.set({
    basePath: '../../',

    frameworks: ['mocha', 'chai', 'sinon'],

    files: ['spec/karma/index.js'],

    preprocessors: {
      'spec/karma/index.js': ['webpack', 'sourcemap']
    },

    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-sinon'),
      require('karma-webpack'),
      require('karma-sourcemap-loader'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher')
    ],

    webpack: {
      resolve: webpack.resolve,
      module: webpack.module,
      devtool: 'eval',
      watch: true
    },

    webpackMiddleware: {
      noInfo: true
    },

    reporters: ['progress'],

    coverageReporter: {
      reporters: [
        {
          type: 'html',
          dir: 'coverage/'
        },
        {
          type: 'cobertura',
          dir: 'coverage/',
          file: 'coverage.xml' // To match simplecov
        }
      ]
    },

    browsers: ['PhantomJS'],
    port: 9886,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true
  });
};
