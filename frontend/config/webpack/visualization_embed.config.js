/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/visualization_embed'),
  entry: common.withHotModuleEntries({
    'main': './main',
    'loader': './loader'
  }),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('.eslintrc.json'),
  externals: {
    jquery: true // See comment re: jquery_include in frontend/app/views/layouts/styleguide.html
  },
  module: {
    loaders: common.getStandardLoaders(
      [
        {
          test: /\.s?css$/,
          // Process styles but don't inline images. We don't use them.
          loader: 'style-loader!css-loader?url=false!sass-loader'
        }
      ],
      {
        babelRewirePlugin: true
      },
      {
        test: /\.yml$/,
        loaders: ['json', 'yaml']
      }
    )
  },
  resolve: _.extend(
    {
      alias: {
        'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js'
      }
    },
    common.getStandardResolve([ 'public/javascripts/visualization_embed' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));