var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/mobile'),
  entry: './main',
  output: common.getOutput(identifier),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      {
        test: /\.scss|\.css$/,
        loader: 'style!css!autoprefixer-loader!sass'
      },
      {
        test: /\.svg/,
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  externals: common.packageJson.config.dataLensWebpackExternals,
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
