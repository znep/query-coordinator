/* eslint-env node */

// Note: this should be used for apps that need to have jQuery bundled rather than loaded externally.

var _ = require('lodash');
var path = require('path');

var webpackHelpers = require('./helpers');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(webpackHelpers.frontendRoot, 'public/javascripts'),
  entry: webpackHelpers.withHotModuleEntries({
    'gridViewSocrataVisualizations': 'grid_view_socrata_visualizations/main.js',
    'visualizationEmbedLoader': 'visualization_embed/loader.js',
    'visualizationEmbedMain': 'visualization_embed/main.js'
  }),
  output: webpackHelpers.getOutput(identifier),
  module: {
    loaders: webpackHelpers.getStandardLoaders()
  },
  resolve: _.extend(
    {
      alias: {
        'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js'
      }
    },
    webpackHelpers.getStandardResolve()
  ),
  plugins: webpackHelpers.plugins.concat(webpackHelpers.getManifestPlugin(identifier))
}, require('./base'));
