/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

var plugins = common.plugins.concat(common.getManifestPlugin(identifier));
if (!common.isProduction) {
  plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/datasetLandingPage'),
  entry: common.getHotModuleEntries().concat([
    './main'
  ]),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/datasetLandingPage/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders()
  },
  resolve: common.getStandardResolve([ 'public/javascripts/datasetLandingPage' ]),
  plugins: plugins
}, require('./base'));
