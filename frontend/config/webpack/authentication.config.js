/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/authentication'),
  entry: common.withHotModuleEntries({'index': './index'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/authentication/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders()
  },
  resolve: common.getStandardResolve([ 'public/javascripts/authentication' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
