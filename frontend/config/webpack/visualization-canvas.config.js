/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/visualizationCanvas'),
  entry: './main',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/visualizationCanvas/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [ path.resolve(common.root, 'public/javascripts') ],
        loader: 'babel'
      },
      {
        test: /\.scss|\.css$/,
        loader: 'style!css!autoprefixer-loader!sass'
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: {
    root: [
      path.resolve(common.root, 'public/javascripts/visualizationCanvas')
    ]
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
