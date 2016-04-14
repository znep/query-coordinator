var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/src'),
  entry: {
    'admin-georegions-screen': './screens/admin-georegions-screen',
    'admin-jobs': './screens/admin-jobs',
    'admin-show-job': './screens/admin-show-job'
  },
  output: common.getOutput(identifier),
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loaders: ['babel']
    }]
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier)),
}, require('./base'));
