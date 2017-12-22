/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/datasetLandingPage'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/datasetLandingPage/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders([], {
      substituteStyleLoaders: [
        {
          // Matches stylesheets without the `.module.` affix - goes through normal style loaders.
          test: /^((?!\.module\.).)*(s?css)$/,
          // Process styles but don't inline images. We don't use them.
          loader: 'style-loader!css-loader?url=false!sass-loader'
        },
        {
          // Matches stylesheets with the `.module.` affix - goes through CSS Module loaders.
          test: /.*\.module\.s?css$/,
          loader: 'style?sourceMap!css?modules&localIdentName=[name]___[local]---[hash:base64:5]&importLoaders=2!postcss!sass'
        }
      ]
    })
  },
  resolve: common.getStandardResolve([ 'public/javascripts/datasetLandingPage' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
