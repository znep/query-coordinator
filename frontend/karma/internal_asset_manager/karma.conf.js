var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'internal_asset_manager.config.js',
  [ 'karma/internal_asset_manager', 'public/javascripts' ]
);

// In Rails, some modules are handled specially. We don't want that for tests.
delete webpackConfig.resolve.alias;
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function ( karma ) {
  karma.set(karmaConfig({
    files: [
      'karma/internal_asset_manager/index.js'
    ],
    webpack: webpackConfig
  }));
};
