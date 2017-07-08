var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'admin-goals.config.js',
  [ 'karma/adminGoals' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/adminGoals/index.js'
    ],
    webpack: webpackConfig
  }));
};
