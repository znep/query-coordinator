/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/userProfile'),
  entry: common.withHotModuleEntries({ 'main': './main' }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/userProfile/.eslintrc.json'),
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
    }].concat(common.getStandardLoaders())
  },
  resolve: _.extend(
    { alias: { 'jquery': 'jQuery' } },
    common.getStandardResolve([ 'public/javascripts/userProfile' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
