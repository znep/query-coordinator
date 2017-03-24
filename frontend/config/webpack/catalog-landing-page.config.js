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
  context: path.resolve(common.root, 'public/javascripts/catalogLandingPage'),
  entry: common.withHotModuleEntries({
    'main': './main',
    'manage': './manage',
    'catalog': './catalog'
  }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/catalogLandingPage/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(common.root, 'public/javascripts'),
          path.resolve(common.root, 'node_modules/socrata-components/common')
        ],
        loaders: (common.isProduction ? ['babel'] : ['react-hot', 'babel'])
      }
    ]
  },
  resolve: {
    alias: {
      'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
      'jquery': 'jQuery'
    },
    root: [
      path.resolve(common.root, 'public/javascripts/catalogLandingPage')
    ]
  },
  plugins: plugins
}, require('./base'));
