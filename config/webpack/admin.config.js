/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/src'),
  entry: {
    'admin-georegions-screen': './screens/admin-georegions-screen',
    'admin-activity-feed': ['../plugins/daterangepicker.jquery.js', './screens/admin-activity-feed'],
    'admin-activity-feed-show': './screens/admin-activity-feed-show',
    'admin-edit-connector': './screens/admin-edit-connector'
  },
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/src/.eslintrc.json'),
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loaders: ['babel']
    }]
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
