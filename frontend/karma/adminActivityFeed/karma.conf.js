var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'admin-activity-feed.config.js',
  [ 'karma/adminActivityFeed', 'public/javascripts' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      { pattern: 'node_modules/babel-polyfill/browser.js', instrument: false},
      'karma/adminActivityFeed/index.js'
    ],
    webpack: webpackConfig
  }));
};
