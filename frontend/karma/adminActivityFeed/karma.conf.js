var path = require('path');

var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
	'admin-activity-feed.config.js',
	[ 'karma/adminActivityFeed', 'public/javascripts' ]
);

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/adminActivityFeed/index.js'
    ],
    webpack: webpackConfig
  }));
};
