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
  context: path.resolve(common.frontendRoot, 'public/javascripts/internalAssetManager'),
  entry: common.withHotModuleEntries({
    'main': './main',
    'last-accessed': './last-accessed'
  }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/internalAssetManager/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: [
      common.getBabelLoader(),
      {
        // Prevent lodash from putting itself on window.
        // See: https://github.com/lodash/lodash/issues/2671
        test: /node_modules\/lodash/,
        loader: 'imports?define=>undefined'
      }
    ]
  },
  resolve: _.extend(
    {
      alias: {
        'jquery': 'jQuery'
      }
    },
    common.getStandardResolve([ 'public/javascripts/internalAssetManager' ])
  ),
  plugins: plugins
}, require('./base'));
