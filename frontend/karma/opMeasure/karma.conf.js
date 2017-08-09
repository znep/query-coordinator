const _ = require('lodash');

const karmaConfig = require('../helpers/karma_config');
const webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'op-measure.config.js',
  [ 'karma/opMeasure' ]
);
webpackConfig.externals = {
  jquery: 'jQuery'
};

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
      'public/javascripts/jquery-2.2.4.js',
      'karma/opMeasure/index.js'
    ],
    webpack: webpackConfig
  }));
};
