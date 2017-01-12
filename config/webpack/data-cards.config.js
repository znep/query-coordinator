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
        exclude: /node_modules/,
        loaders: [
          'ng-annotate',
          'babel'
        ]
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loaders: [
          'ngtemplate?requireAngular&relativeTo=' + path.resolve(common.root, 'public/angular_templates'),
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
      'angular_templates': path.resolve(common.root, 'public/angular_templates'),
      plugins: path.resolve(common.root, 'public/javascripts/plugins'),
      'jQuery': path.resolve(common.root, 'node_modules/jquery/dist/jquery.js')
    }
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
