/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/src'),
  entry: common.withHotModuleEntries({
    'admin-georegions-screen': './screens/admin-georegions-screen',
    'admin-activity-feed': ['../plugins/daterangepicker.jquery.js', './screens/admin-activity-feed'],
    'admin-activity-feed-show': './screens/admin-activity-feed-show',
    'admin-connector': './screens/admin-connector',
    'admin-edit-connector': './screens/admin-edit-connector',
    'admin-new-connector': './screens/admin-new-connector'
  }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/src/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders()
  },
  resolve: common.getStandardResolve(),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
