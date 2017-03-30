var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'import-wizard.config.js',
  [ 'karma/importWizard' ]
);

module.exports = function(karma) {
  karma.set(karmaConfig({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/importWizard/index.js'
    ],

    preprocessors: {
      'karma/importWizard/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['mocha', 'dots'],

    webpack: webpackConfig
  }));
};
