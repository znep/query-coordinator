var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/userProfile' ],
  [ 'userProfile' ]
);

module.exports = function(karma) {
  karma.set(karmaConfig({
    files: [
      'karma/userProfile/index.js'
    ],
    webpack: webpackConfig
  }));
};
