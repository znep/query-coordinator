/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/visualizationCanvas'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/visualizationCanvas/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders([
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ],
    {
      substituteStyleLoaders: [
        {
          test: /\.s?css$/,
          // Process styles but don't inline images. We don't use them.
          loader: 'style-loader!css-loader?url=false!sass-loader'
        }
      ]
    })
  },
  resolve: common.getStandardResolve([ 'public/javascripts/visualizationCanvas' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
