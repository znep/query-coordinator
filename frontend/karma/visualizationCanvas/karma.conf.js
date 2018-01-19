const _ = require('lodash');

const karmaConfig = require('../helpers/karma_config');
const webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/visualizationCanvas' ],
  [ 'visualizationCanvas' ]
);

// NOTE: This will not work with webpack v2
const babelPluginRewire = require.resolve('babel-plugin-rewire');
const babelLoader = _.find(webpackConfig.module.loaders, { loader: 'babel'});
const hasRewire = _.some(babelLoader.query.plugins, (plugin) => plugin === babelPluginRewire);

if (!hasRewire) {
  babelLoader.query.plugins.push(babelPluginRewire);
}

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/visualizationCanvas/index.js'
    ],
    webpack: webpackConfig
  }));
};
