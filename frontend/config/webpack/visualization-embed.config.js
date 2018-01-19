/* eslint-env node */

// Note: this is not in the shared config only because it cannot have jQuery as an external, since embeds
// will be used on external pages.

var _ = require('lodash');
var path = require('path');

var webpackHelpers = require('./helpers');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(webpackHelpers.frontendRoot, 'public/javascripts'),
  entry: webpackHelpers.withHotModuleEntries({
    'loader': 'visualization_embed/loader.js',
    'main': 'visualization_embed/main.js'
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
