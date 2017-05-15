var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'admin-goals.config.js',
  [ 'karma/adminGoals' ]
);

// Allows us to load json fixture files.
webpackConfig.module.loaders.push( {
  test: /\.json$/,
  loader: 'json-loader'
});

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/adminGoals/index.js'
    ],
    webpack: webpackConfig
  }));
};
