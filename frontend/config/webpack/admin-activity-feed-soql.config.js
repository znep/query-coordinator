/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/adminActivityFeedSoql'),
  entry: common.withHotModuleEntries({'main': './main.js'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminActivityFeedSoql/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders()
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/adminActivityFeedSoql' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
