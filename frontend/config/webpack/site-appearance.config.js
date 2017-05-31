// See also public/javascripts/site-appearance/main.js

/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');
var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/siteAppearance'),
  entry: common.withHotModuleEntries('./main'),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/siteAppearance/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders(
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    )
  },
  resolve: _.extend(
    {
      alias: {
        'react': path.resolve(common.frontendRoot, 'node_modules/react'),
        'react-dom': path.resolve(common.frontendRoot, 'node_modules/react-dom')
      }
    },
    common.getStandardResolve([ 'public/javascripts/siteAppearance' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
