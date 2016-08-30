/*eslint-env node */
var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/importWizard'),
  entry: './main',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/importWizard/.eslintrc.json'),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: path.resolve(common.root, 'public/javascripts'),
        loader: 'babel'
      }
    ]
  },
  resolve: {
    alias: {
      'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
      'jquery.awesomereorder': path.resolve(common.root, 'public/javascripts/plugins/jquery.awesomereorder.js')
    }
  },
  externals: {
    // TODO: compress these down to one...
    'importableTypes': 'importableTypes',
    'datasetCategories': 'datasetCategories',
    'customMetadataSchema': 'customMetadataSchema',
    'enabledModules': 'enabledModules',
    'licenses': 'licenses',
    'importSource': 'importSource',
    'view': 'view'
  },
  plugins: common.plugins.concat(
    common.getManifestPlugin(identifier),
    new webpack.ProvidePlugin({
      Promise: 'imports?this=>global!exports?global.Promise!es6-promise'
    })
  )
}, require('./base'));
