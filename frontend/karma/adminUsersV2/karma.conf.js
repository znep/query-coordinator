var karmaConfig = require('../helpers/karma_config');
var _ = require('lodash');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'admin-users-v2.config.js',
  [ 'karma/adminUsersV2', '.' ]
);

webpackConfig.externals = {
  jquery: 'jQuery',
  'react/addons': true,
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': 'window'
};

webpackConfig.resolve.extensions = ['', '.js', '.scss', '.json'];

module.exports = function(karma) {
  karma.set(karmaConfig({
    files: [
      'karma/adminUsersV2/index.js'
    ],
    webpack: webpackConfig
  }));
};
