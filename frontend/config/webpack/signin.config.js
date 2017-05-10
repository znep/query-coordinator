/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/signin'),
  entry: './main.js',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/signin/.eslintrc.json'),
  module: {
    loaders: [
      common.getBabelLoader(),
      {
        test: /\.(css|scss)$/,
        loaders: [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          'autoprefixer-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: common.getStandardResolve([ 'public/javascripts/signin' ]),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
