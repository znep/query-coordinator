/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep(
  {
    context: path.resolve(
      common.frontendRoot,
      'public/javascripts/internalAssetManager'
    ),
    entry: common.withHotModuleEntries({
      main: './main'
    }),
    output: common.getOutput(identifier),
    externals: { jquery: true },
    module: {
      loaders: common.getStandardLoaders([
        {
          exclude: [
            /\.html$/,
            /\.(js|jsx)$/,
            /\.(css|scss)$/,
            /\.json$/,
            /\.svg$/
          ],
          loader: 'url',
          test: /\.(png|jpg|gif|jpeg)$/,
          query: {
            limit: 10000,
            name: 'static/media/[name].[hash:8].[ext]'
          }
        }
      ])
    },
    resolve: _.extend(
      { alias: { jquery: 'jQuery' } },
      common.getStandardResolve(['public/javascripts/internalAssetManager'])
    ),
    plugins: common.plugins.concat(common.getManifestPlugin(identifier))
  },
  require('./base')
);
