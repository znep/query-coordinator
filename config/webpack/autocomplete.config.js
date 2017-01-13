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
        include: [
          path.resolve(common.root, 'public/javascripts/autocomplete'),
          path.resolve('node_modules/socrata-components/common')
        ],
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          'sass'
        ]
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader',
        include: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      },
      {
        test: /\.(eot|woff|svg|woff2|ttf)$/,
        loader: 'url-loader?limit=100000',
        exclude: path.resolve('node_modules/socrata-components/dist/fonts/svg')
      }
    ]
  },
  sassLoader: {
    includePaths: [
      'node_modules/bourbon/app/assets/stylesheets',
      'node_modules/bourbon-neat/app/assets/stylesheets',
      'node_modules/breakpoint-sass/stylesheets',
      'node_modules/modularscale-sass/stylesheets',
      'node_modules/normalize.css',
      'node_modules/socrata-components',
      'node_modules/react-input-range/dist',
      'node_modules/react-datepicker/dist'
    ]
  },
  resolve: {
    alias: {
      styles: path.resolve('node_modules/socrata-components/dist/styles'),
      icons: path.resolve('node_modules/socrata-components/dist/fonts/svg'),
      socrataCommon: path.resolve('node_modules/socrata-components/common')
    }
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
