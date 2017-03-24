/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/autocomplete'),
  entry: './main.js',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/autocomplete/.eslintrc.json'),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [ path.resolve(common.root, 'public/javascripts/autocomplete') ],
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
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
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
