var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/internal_asset_manager' ],
  [ 'internalAssetManager' ]
);

module.exports = function ( karma ) {
  karma.set(karmaConfig({
    files: [
      'karma/internal_asset_manager/index.js'
    ],
    webpack: webpackConfig
  }));
};
