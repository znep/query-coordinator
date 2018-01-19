var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/adminActivityFeedSoql', 'karma/helpers' ],
  [ 'adminActivityFeedSoql' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      { pattern: 'node_modules/babel-polyfill/browser.js', instrument: false},
      'karma/adminActivityFeedSoql/index.js'
    ],
    webpack: webpackConfig
  }));
};
