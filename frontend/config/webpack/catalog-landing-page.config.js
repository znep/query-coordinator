/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/catalogLandingPage'),
  entry: common.withHotModuleEntries({'main': './main', 'manage': './manage', 'catalog': './catalog'}),
  output: common.getOutput(identifier),
  module: {
    loaders: common.getStandardLoaders([], {
      substituteStyleLoaders: {
        test: /^((?!\.global).)*(scss|css)$/,
        loaders: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
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
