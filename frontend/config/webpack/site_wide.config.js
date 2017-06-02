/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, '../common'),
  entry: common.withHotModuleEntries({'site_wide': './site_wide'}),
  module: {
    loaders: common.getStandardLoaders(
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
          'sass'
        ]
      }
    )
  },
  output: common.getOutput(identifier),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier)),
  resolve: common.getStandardResolve()
}, require('./base'));
