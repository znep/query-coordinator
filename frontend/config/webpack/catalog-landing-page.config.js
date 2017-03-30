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
  context: path.resolve(common.root, 'public/javascripts/catalogLandingPage'),
  entry: common.withHotModuleEntries({
    'main': './main',
    'manage': './manage',
    'catalog': './catalog'
  }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/catalogLandingPage/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: [
      common.getBabelLoader()
    ]
  },
  resolve: _.extend(
    {
      alias: {
        'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
        'jquery': 'jQuery'
      }
    },
    common.getStandardResolve([ 'public/javascripts/catalogLandingPage' ])
  ),
  plugins: plugins
}, require('./base'));
