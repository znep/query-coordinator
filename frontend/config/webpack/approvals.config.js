/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/approvals'),
  entry: common.withHotModuleEntries({'main': './main.js'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/approvals/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders(
      {
        test: /\.(css|scss)$/,
        loader: 'style!css!autoprefixer-loader!sass'
      }
    )
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/approvals' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
