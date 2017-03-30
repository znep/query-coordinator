var _ = require('lodash');
var WebpackFailurePlugin = require('./WebpackFailurePlugin.js');

var webpackCommon = require('../../config/webpack/common');

/**
 * Transforms the runtime webpack configuration for a project into
 * a configuration suitable for running karma tests.
 */
function karmaWebpackConfig(webpackConfigFile, extraResolveRoots) {
  var webpackConfig = require('../../config/webpack/' + webpackConfigFile);

  webpackConfig = _.defaultsDeep({
    cache: true,
    devtool: 'inline-source-map',
    plugins: [ new WebpackFailurePlugin() ],
  }, webpackConfig);

  _.defaults(webpackConfig.resolve, { root: [] });
  _.each(extraResolveRoots, function(extraResolveRoot) {
    webpackConfig.resolve.root.push(
      webpackCommon.resolvePath(extraResolveRoot)
    );
  });

  return webpackConfig;
}

module.exports = {
  karmaWebpackConfig: karmaWebpackConfig
};
