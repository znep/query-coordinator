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
  context: path.resolve(common.frontendRoot, '../common'),
  entry: common.withHotModuleEntries({
    'site_wide': './site_wide'
  }),
  module: {
    preLoaders: [
      common.getStyleguidePreLoaders()
    ],
    loaders: [
      common.getBabelLoader(),
      {
        // Prevent lodash from putting itself on window.
        // See: https://github.com/lodash/lodash/issues/2671
        test: /node_modules\/lodash/,
        loader: 'imports?define=>undefined'
      },
      {
        test: /\.(css|scss)$/,
        loaders: [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          'autoprefixer-loader',
          'sass-loader'
        ]
      }
    ]
  },
  output: common.getOutput(identifier),
  plugins: plugins,
  resolve: common.getStandardResolve()
}, require('./base'));
