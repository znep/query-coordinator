/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/internalAssetManager'),
  entry: common.withHotModuleEntries('./main'),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/internalAssetManager/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders({
      // Prevent lodash from putting itself on window.
      // See: https://github.com/lodash/lodash/issues/2671
      test: /node_modules\/lodash/,
      loader: 'imports?define=>undefined'
    })
  },
  resolve: _.extend(
    {
      alias: {
        'jquery': 'jQuery'
      }
    },
    common.getStandardResolve([ 'public/javascripts/internalAssetManager' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
