/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/adminActivityFeed'),
  entry: './main.js',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminActivityFeed/.eslintrc.json'),
  module: {
    loaders: [
      common.getBabelLoader(),
      {
        test: /\.scss|\.css$/,
        loader: 'style!css!autoprefixer-loader!sass'
      },
      {
        test: /\.svg/,
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
        exclude: common.svgFontPath
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/adminActivityFeed' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
