var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/exampleTestSuite' ], // UPDATE
  [ 'exampleTestSuite' ] // UPDATE
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/exampleTestSuite/index.js' // UPDATE
    ],
    webpack: webpackConfig
  }));
};
