/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/mobile'),
  entry: './main',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/mobile/.eslintrc.json'),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
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
      },
      {
        test: require.resolve('jquery'),
        loader: 'expose?$!expose?jQuery'
      }
    ]
  },
  resolve: {
    root: [
      path.resolve(common.root, 'node_modules')
    ],
    alias: {
      'jQuery': path.resolve(common.root, 'node_modules/jquery/dist/jquery.js')
    }
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
