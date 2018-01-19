var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/catalogLandingPage' ],
  [ 'catalogLandingPageMain', 'catalogLandingPageManage' ]
);

module.exports = function(karma) {
  karma.set(karmaConfig({
    files: [
      'karma/catalogLandingPage/index.js'
    ],
    webpack: webpackConfig
  }));
};
