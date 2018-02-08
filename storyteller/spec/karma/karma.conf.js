var path = require('path');
var webpack = require(path.resolve('.', 'config/webpack.config.js'));

module.exports = function(config) { //eslint-disable-line no-undef

  config.set({
    basePath: '../../',

    preprocessors: {
      'spec/karma/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha'],

    reporters: ['dots'],


    files: ['spec/karma/environment.js', 'spec/karma/index.js'],

    webpack: webpack,

    webpackMiddleware: {
      noInfo: true,
      quiet: true
    },

    mochaReporter: {
      showDiff: true
    },

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
