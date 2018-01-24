/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var webpackHelpers = require('./helpers');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(webpackHelpers.frontendRoot, 'public/javascripts/angular/src'),
  entry: webpackHelpers.withHotModuleEntries({'main': './main'}),
  output: webpackHelpers.getOutput(identifier),
  // eslint file paths below are relative to platform-ui/frontend
  eslint: webpackHelpers.getEslintConfig(webpackHelpers.isProduction ? '.eslintrc.json' : '.eslintrc-dev.json'),
  module: {
    loaders: webpackHelpers.getStandardLoaders(
      [
        {
          test: /\.png$/,
          loader: 'url-loader?limit=100000'
        },
        {
          test: require.resolve('jquery'),
          loader: 'expose?$!expose?jQuery'
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          loaders: [
            'ngtemplate?requireAngular&relativeTo=' + path.resolve(webpackHelpers.frontendRoot, 'public/angular_templates'),
            'html?minimize=false'
          ]
        }
      ],
      {
        reactHotLoader: false
      }
    )
  },
  resolve: _.extend(
    {
      alias: {
        'angular_templates': path.resolve(webpackHelpers.frontendRoot, 'public/angular_templates'),
        plugins: path.resolve(webpackHelpers.frontendRoot, 'public/javascripts/plugins'),
        'jQuery': path.resolve(webpackHelpers.frontendRoot, 'node_modules/jquery/dist/jquery.js')
      }
    },
    webpackHelpers.getStandardResolve()
  ),
  plugins: webpackHelpers.plugins.concat(webpackHelpers.getManifestPlugin(identifier))
}, require('./base'));
