/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/opMeasure'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders([
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ])
  },
  resolve: common.getStandardResolve([ 'public/javascripts/opMeasure' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
