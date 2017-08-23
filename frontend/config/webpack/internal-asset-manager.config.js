/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/internalAssetManager'),
  entry: common.withHotModuleEntries({ 'main': './main', 'profile': './profile' }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/internalAssetManager/.eslintrc.json'),
  externals: { jquery: true },
  module: {
    loaders: [{
      exclude: [
        /\.html$/,
        /\.(js|jsx)$/,
        /\.(css|scss)$/,
        /\.json$/,
        /\.svg$/
      ],
      loader: 'url',
      query: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]'
      }
    }].concat(common.getStandardLoaders({
      // Prevent lodash from putting itself on window.
      // See: https://github.com/lodash/lodash/issues/2671
      test: /node_modules\/lodash/,
      loader: 'imports?define=>undefined'
    })).concat({
      test: /\.(css|scss)$/,
      loaders: [
        'style-loader',
        'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
        'autoprefixer-loader',
        'sass-loader'
      ]
    })
  },
  resolve: _.extend(
    { alias: { 'jquery': 'jQuery' } },
    common.getStandardResolve([ 'public/javascripts/internalAssetManager' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
