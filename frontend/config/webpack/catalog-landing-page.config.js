/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/catalogLandingPage'),
  entry: common.withHotModuleEntries(['./main', './manage', './catalog']),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/catalogLandingPage/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders()
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
