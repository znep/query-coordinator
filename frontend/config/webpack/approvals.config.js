/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/approvals'),
  entry: common.withHotModuleEntries({'main': './main.js'}),
  output: common.getOutput(identifier),
  module: {
    loaders: common.getStandardLoaders(null, {
      substituteStyleLoaders: {
        test: /\.s?css$/,
        loader: 'style-loader!css-loader!postcss-loader!sass-loader'
      }
    })
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/approvals' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
