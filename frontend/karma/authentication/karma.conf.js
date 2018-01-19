var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/authentication' ],
  [ 'authentication' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/authentication/index.js'
    ],
    webpack: webpackConfig
  }));
};
