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
  context: path.resolve(common.root, 'public/javascripts/assetSelector'),
  entry: common.getHotModuleEntries().concat([
    './main'
  ]),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/assetSelector/.eslintrc.json'),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: path.resolve(common.root, 'public/javascripts'),
        loaders: (common.isProduction ? ['babel'] : ['react-hot', 'babel'])
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.(eot|svg|ttf|woff|woff2)$/, loader: 'url-loader?limit=10000' }
    ]
  },
  resolve: {
    alias: {
      'react': path.resolve(common.root, 'node_modules/react'),
      'react-dom': path.resolve(common.root, 'node_modules/react-dom')
    },
    root: [
      path.resolve(common.root, 'public/javascripts/assetSelector')
    ]
  },
  plugins: plugins
}, require('./base'));
