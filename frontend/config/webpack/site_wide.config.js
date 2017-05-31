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
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
          'sass'
        ]
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader',
        include: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      },
      {
        test: /\.(eot|woff|svg|woff2|ttf)$/,
        loader: 'url-loader?limit=100000',
        exclude: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      }
    ]
  },
  output: common.getOutput(identifier),
  plugins: plugins,
  resolve: common.getStandardResolve()
}, require('./base'));
