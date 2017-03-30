var karmaConfig = require('../helpers/karma_config');
var _ = require('lodash');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'dataset-management-ui.config.js',
  [ 'karma/datasetManagementUI', '.' ]
);

webpackConfig.externals = {
  jquery: 'jQuery'
};

// Allows us to load json fixture files.
webpackConfig.module.loaders.push( {
  test: /\.json$/,
  loader: 'json-loader'
});

// To make tests easier to write, we disable auto scss class prefixes.
var styleLoader = _(webpackConfig.module.loaders).find((loader) =>
  loader.loader.indexOf('localIdentName') >= 0
);
styleLoader.loader = 'style?sourceMap!css?modules&localIdentName=[local]&importLoaders=1!postcss!sass';

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/datasetManagementUI/index.js'
    ],
    webpack: webpackConfig
  }));
};
