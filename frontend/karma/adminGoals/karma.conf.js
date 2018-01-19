var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/adminGoals' ],
  [ 'adminGoals' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/adminGoals/index.js'
    ],
    webpack: webpackConfig
  }));
};
