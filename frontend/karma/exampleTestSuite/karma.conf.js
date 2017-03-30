var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'example.config.js', // UPDATE
  [ 'karma/exampleTestSuite' ] // UPDATE
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/exampleTestSuite/index.js' // UPDATE
    ],
    webpack: webpackConfig
  }));
};
