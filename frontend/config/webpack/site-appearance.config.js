// See also public/javascripts/site-appearance/main.js

/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');
var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

var plugins = common.plugins.concat(common.getManifestPlugin(identifier));
if (!common.isProduction) {
  plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/siteAppearance'),
  entry: common.getHotModuleEntries().concat([
    './main'
  ]),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/siteAppearance/.eslintrc.json'),
  module: {
    loaders: [
      common.getBabelLoader(),
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'url-loader?limit=10000',
        exclude: common.svgFontPath
      }
    ]
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
  plugins: plugins
}, require('./base'));
