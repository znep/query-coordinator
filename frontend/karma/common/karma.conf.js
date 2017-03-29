var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'base',
  [ 'public/javascripts/common', 'karma/common' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/common/index.js'
    ],
    webpack: webpackConfig
  }));
};
