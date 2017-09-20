var karmaConfig = require('../helpers/karma_config');
var webpack = require('webpack');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'authentication.config.js',
  [ 'karma/authentication' ]
);
webpackConfig.externals = {
  'cheerio': 'window',
  'react/addons': true,
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': true
};
webpackConfig.plugins.push(
  new webpack.ProvidePlugin({
    Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
    fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
    $: 'jquery',
    jQuery: 'jquery'
  })
);


module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/authentication/index.js'
    ],
    webpack: webpackConfig
  }));
};
