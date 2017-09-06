/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/angular/src'),
  entry: common.withHotModuleEntries({'main': './main'}),
  output: common.getOutput(identifier),
  // eslint file paths below are relative to platform-ui/frontend
  eslint: common.getEslintConfig(common.isProduction ? '.eslintrc.json' : '.eslintrc-dev.json'),
  module: {
    loaders: common.getStandardLoaders(
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
            'ngtemplate?requireAngular&relativeTo=' + path.resolve(common.frontendRoot, 'public/angular_templates'),
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
        'angular_templates': path.resolve(common.frontendRoot, 'public/angular_templates'),
        plugins: path.resolve(common.frontendRoot, 'public/javascripts/plugins'),
        'jQuery': path.resolve(common.frontendRoot, 'node_modules/jquery/dist/jquery.js')
      }
    },
    common.getStandardResolve()
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
