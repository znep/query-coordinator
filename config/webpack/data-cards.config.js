/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/angular/src'),
  entry: './main',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig(common.isProduction ? '.eslintrc.json' : '.eslintrc-dev.json'),
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loaders: [
          'ng-annotate',
          'babel'
        ]
      },
      {
        test: /\.html$/,
        exclude: /(node_modules|bower_components)/,
        loaders: [
          'ngtemplate?relativeTo=' + path.resolve(common.root, 'public/angular_templates'),
          'html?minimize=false'
        ]
      },
      {
        test: /modernizr\.js$/,
        loader: 'imports?this=>window'
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
    alias: {
      'angular_templates': path.resolve(common.root, 'public/angular_templates'),
      plugins: path.resolve(common.root, 'public/javascripts/plugins'),
      'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
      'socrata.utils': 'socrata-utils/dist/socrata.utils.js',
      '_': 'lodash'
    }
  },
  externals: common.packageJson.config.dataCardsWebpackExternals,
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
