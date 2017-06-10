/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/demos/visualizations'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('.eslintrc.json'),
  externals: {
    jquery: true // See comment re: jquery_include in frontend/app/views/layouts/styleguide.html
  },
  module: { loaders: common.getStandardLoaders() },
  resolve: _.extend(
    {
      alias: {
        'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
      }
    },
    common.getStandardResolve([ 'public/javascripts/demos/visualizations' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
