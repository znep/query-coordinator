/*eslint-env node */
var path = require('path');
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
      'socrata-utils': 'socrata-utils/dist/socrata.utils.js'
    }
  },
  externals: {
    'importableTypes': 'importableTypes',
    'datasetCategories': 'datasetCategories',
    'customMetadataSchema': 'customMetadataSchema',
    'enabledModules': 'enabledModules',
    'licenses': 'licenses',
    // TODO: eventually compress into ImportSource
    'view': 'view'
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));