/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/adminUsersV2'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminUsersV2/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders(
      {
        test: /\.(css|scss)$/,
        loaders: [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          'autoprefixer-loader',
          'sass-loader'
        ]
      }
    )
  },
  resolve: common.getStandardResolve([ 'public/javascripts/adminUsersV2' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
