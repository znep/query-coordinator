/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/catalogLandingPage'),
  entry: common.withHotModuleEntries({'main': './main', 'manage': './manage', 'catalog': './catalog'}),
  output: common.getOutput(identifier),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders([], {
      substituteStyleLoaders: [
        {
          // Matches stylesheets without the `.module.` affix - goes through normal style loaders.
          test: /^((?!\.module\.).)*(s?css)$/,
          loader: 'style?sourceMap!css!postcss!sass'
        },
        {
          // Matches stylesheets with the `.module.` affix - goes through CSS Module loaders.
          test: /.*\.module\.s?css$/,
          loader: 'style?sourceMap!css?modules&localIdentName=[name]___[local]---[hash:base64:5]&importLoaders=2!postcss!sass'
        }
      ]
    })
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
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
