var _ = require('lodash');

var WebpackFailurePlugin = require('./WebpackFailurePlugin.js');
var webpackCommon = require('../../config/webpack/helpers');

/**
 * Transforms the runtime webpack configuration for a project into
 * a configuration suitable for running karma tests.
 */
function karmaWebpackConfig(webpackConfigFile, extraResolveRoots, webpackSharedEntries) {
  var webpackConfig = require(`../../config/webpack/${webpackConfigFile}`);

  if (webpackConfigFile === 'shared.config.js' && webpackSharedEntries) {
    // Limit the entries of the shared config to only the app we're testing
    webpackConfig.entry = _.pickBy(webpackConfig.entry, function(value, key) {
      return _.includes(webpackSharedEntries, key);
    });
  }

  webpackConfig = _.defaultsDeep({
    cache: true,
    devtool: 'inline-source-map',
    plugins: [ new WebpackFailurePlugin() ]
  }, webpackConfig);

  _.defaults(webpackConfig.resolve, { root: [ webpackCommon.resolvePath('public/javascripts') ] });
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
