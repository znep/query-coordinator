var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/adminUsersV2', '.' ],
  [ 'adminUsersV2' ]
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
