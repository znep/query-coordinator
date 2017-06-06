/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/adminGoals'),
  entry: common.withHotModuleEntries({'main': './main.js'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminGoals/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders([
      {
        test: /\.scss|\.css$/,
        loader: 'style!css!autoprefixer-loader!sass'
      },
      {
        test: /\.svg/, // TODO Why is this regex not anchored at EOL?
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
        exclude: common.svgFontPath
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ])
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/adminGoals' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
